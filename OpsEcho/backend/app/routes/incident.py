from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.incident import Incident, IncidentCreate, IncidentFeedback, AnalysisResult, PostMortemReport, Learning, LearningCreate
from app.services.groq_service import analyze_incident_with_groq
from datetime import datetime

router = APIRouter()

# In-memory Database
MOCK_INCIDENTS = {
    "INC-001": {
        "id": "INC-001",
        "title": "Database connection timeout",
        "description": "Application cannot connect to PostgreSQL database. Requests are failing with timeout errors after 30s. Connection pool appears exhausted during peak load.",
        "severity": "High",
        "status": "Active",
        "time": "Sep 28, 2026 - 10:30 AM"
    },
    "INC-002": {
        "id": "INC-002",
        "title": "API response latency spike",
        "description": "REST API endpoints returning responses 5x slower than normal. P99 latency jumped from 200ms to 1.2s. Affecting user-facing checkout flow.",
        "severity": "Medium",
        "status": "Resolved",
        "time": "Sep 27, 2026 - 3:15 PM"
    },
    "INC-003": {
        "id": "INC-003",
        "title": "Memory leak in worker service",
        "description": "Worker pods consuming 4GB+ memory and being OOMKilled every 2 hours. Suspected leak in image processing pipeline. Garbage collection not reclaiming memory.",
        "severity": "High",
        "status": "Resolved",
        "time": "Sep 26, 2026 - 8:45 AM"
    },
    "INC-004": {
        "id": "INC-004",
        "title": "Authentication service 503 errors",
        "description": "OAuth2 authentication service intermittently returning 503 Service Unavailable. Users unable to log in during affected periods. Health checks passing but requests failing.",
        "severity": "High",
        "status": "Active",
        "time": "Sep 25, 2026 - 11:20 PM"
    },
    "INC-005": {
        "id": "INC-005",
        "title": "Frontend build pipeline failure",
        "description": "CI/CD pipeline failing on frontend build step. Webpack throwing out-of-memory errors. Build cache appears corrupted after recent dependency update.",
        "severity": "Low",
        "status": "Resolved",
        "time": "Sep 24, 2026 - 2:00 PM"
    },
    "INC-006": {
        "id": "INC-006",
        "title": "Redis cache eviction storm",
        "description": "Redis cluster experiencing mass key evictions. Cache hit rate dropped from 95% to 12%. Database load spiked as a result, causing cascading slowdowns.",
        "severity": "High",
        "status": "Active",
        "time": "Sep 23, 2026 - 6:30 PM"
    },
    "INC-007": {
        "id": "INC-007",
        "title": "SSL certificate expiration warning",
        "description": "Production SSL certificate for api.opsecho.com expiring in 3 days. Auto-renewal via Let's Encrypt failing with DNS validation error.",
        "severity": "Medium",
        "status": "Resolved",
        "time": "Sep 22, 2026 - 9:00 AM"
    },
}

# In-memory post-mortem storage
POST_MORTEMS = {
    "INC-003": {
        "incident_id": "INC-003",
        "title": "Memory leak in worker service",
        "severity": "High",
        "resolved_at": "Sep 26, 2026 - 12:30 PM",
        "summary": "Worker service pods were experiencing Out-Of-Memory kills every 2 hours due to unreleased image buffers in the processing pipeline.",
        "root_causes": [
            "Image processing library was not releasing buffer memory after each operation",
            "Garbage collector unable to reclaim memory due to circular references in image objects",
            "Missing resource cleanup in the error handling path of the pipeline"
        ],
        "solutions_applied": [
            "Added explicit buffer.release() calls after each image processing step",
            "Implemented context managers for automatic resource cleanup",
            "Added memory usage monitoring with automatic pod restart at 80% threshold"
        ],
        "lessons_learned": [
            "Always implement resource cleanup in both success and error paths",
            "Set up memory usage alerts before OOM conditions occur",
            "Use context managers for resource lifecycle management"
        ],
        "prevention_steps": [
            "Add memory leak detection to CI/CD pipeline",
            "Implement automated load testing with memory profiling",
            "Set up PagerDuty alerts for memory usage above 70%"
        ]
    },
    "INC-005": {
        "incident_id": "INC-005",
        "title": "Frontend build pipeline failure",
        "severity": "Low",
        "resolved_at": "Sep 24, 2026 - 4:45 PM",
        "summary": "CI/CD pipeline was failing due to corrupted webpack cache after a major dependency update. Node.js heap was running out of memory during compilation.",
        "root_causes": [
            "Webpack persistent cache was incompatible with updated loader versions",
            "Node.js max-old-space-size was set too low for the growing bundle",
            "Lock file had conflicting resolution entries after partial update"
        ],
        "solutions_applied": [
            "Cleared webpack cache and rebuilt from scratch",
            "Increased Node.js memory limit to 4GB in CI configuration",
            "Regenerated lock file with clean dependency resolution"
        ],
        "lessons_learned": [
            "Clear build caches when updating major dependencies",
            "Monitor CI build times and resource usage trends",
            "Use lock file validation in pre-commit hooks"
        ],
        "prevention_steps": [
            "Add cache invalidation step to dependency update workflow",
            "Set up alerts for CI build time exceeding baseline by 50%",
            "Document dependency update procedure in runbook"
        ]
    }
}

# Analysis cache
ANALYSIS_CACHE = {}

# Learnings store
LEARNINGS = [
    {
        "id": "LRN-001",
        "incident_id": "INC-003",
        "category": "Memory Management",
        "insight": "Always implement explicit resource cleanup in both success and error code paths. Context managers are the preferred pattern.",
        "created_at": "Sep 26, 2026"
    },
    {
        "id": "LRN-002",
        "incident_id": "INC-005",
        "category": "CI/CD",
        "insight": "Clear all build caches when performing major dependency updates. Stale caches can cause hard-to-debug build failures.",
        "created_at": "Sep 24, 2026"
    },
    {
        "id": "LRN-003",
        "incident_id": "INC-002",
        "category": "Performance",
        "insight": "Set up P99 latency alerts with a baseline comparison. Latency spikes are often early indicators of deeper infrastructure issues.",
        "created_at": "Sep 27, 2026"
    }
]

_next_id_counter = len(MOCK_INCIDENTS) + 1
_next_lrn_counter = len(LEARNINGS) + 1

@router.post("", response_model=Incident)
@router.post("/", response_model=Incident, include_in_schema=False)
async def create_incident(incident: IncidentCreate):
    global _next_id_counter
    new_id = f"INC-{_next_id_counter:03d}"
    _next_id_counter += 1
    now = datetime.now().strftime("%b %d, %Y - %I:%M %p")
    new_incident = {
        "id": new_id,
        "title": incident.title,
        "description": incident.description,
        "severity": incident.severity,
        "status": "Active",
        "time": now
    }
    MOCK_INCIDENTS[new_id] = new_incident
    return new_incident

@router.get("", response_model=List[Incident])
@router.get("/", response_model=List[Incident], include_in_schema=False)
async def get_all_incidents():
    return list(reversed(MOCK_INCIDENTS.values()))

@router.get("/stats")
async def get_stats():
    incidents = list(MOCK_INCIDENTS.values())
    total = len(incidents)
    resolved = sum(1 for i in incidents if i["status"] == "Resolved")
    active = total - resolved
    high = sum(1 for i in incidents if i["severity"] == "High")
    rate = round((resolved / total * 100) if total > 0 else 0)
    return {
        "total": total,
        "resolved": resolved,
        "active": active,
        "high_severity": high,
        "resolution_rate": rate,
        "avg_resolution_hours": 2.3
    }

@router.get("/learnings", response_model=List[Learning])
async def get_learnings(category: Optional[str] = None):
    if category and category.lower() != "all":
        return [l for l in LEARNINGS if l["category"].lower() == category.lower()]
    return list(reversed(LEARNINGS))

@router.post("/learnings", response_model=Learning)
async def add_learning(learning: LearningCreate):
    global _next_lrn_counter
    new_id = f"LRN-{_next_lrn_counter:03d}"
    _next_lrn_counter += 1
    now = datetime.now().strftime("%b %d, %Y")
    new_item = {
        "id": new_id,
        "incident_id": learning.incident_id or "GENERAL",
        "category": learning.category,
        "insight": learning.insight,
        "created_at": now
    }
    LEARNINGS.append(new_item)
    return new_item

@router.delete("/learnings/{learning_id}")
async def delete_learning(learning_id: str):
    global LEARNINGS
    initial_len = len(LEARNINGS)
    LEARNINGS = [l for l in LEARNINGS if l["id"] != learning_id]
    if len(LEARNINGS) == initial_len:
        raise HTTPException(status_code=404, detail="Learning not found")
    return {"message": "Learning deleted successfully"}

@router.get("/post-mortems/all", response_model=List[PostMortemReport])
async def get_all_post_mortems():
    return list(POST_MORTEMS.values())

@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    return MOCK_INCIDENTS[incident_id]

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    del MOCK_INCIDENTS[incident_id]
    if incident_id in ANALYSIS_CACHE:
        del ANALYSIS_CACHE[incident_id]
    if incident_id in POST_MORTEMS:
        del POST_MORTEMS[incident_id]
    return {"message": f"Incident {incident_id} deleted successfully"}

@router.post("/{incident_id}/resolve")
async def resolve_incident(incident_id: str):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    MOCK_INCIDENTS[incident_id]["status"] = "Resolved"
    
    # Auto-generate post-mortem if not exists
    if incident_id not in POST_MORTEMS:
        inc = MOCK_INCIDENTS[incident_id]
        analysis = ANALYSIS_CACHE.get(incident_id, {})
        now = datetime.now().strftime("%b %d, %Y - %I:%M %p")
        POST_MORTEMS[incident_id] = {
            "incident_id": incident_id,
            "title": inc["title"],
            "severity": inc["severity"],
            "resolved_at": now,
            "summary": analysis.get("summary", f"Incident '{inc['title']}' was diagnosed and resolved."),
            "root_causes": analysis.get("root_causes", ["Root cause isolated and mitigated."]),
            "solutions_applied": analysis.get("suggested_solutions", ["Applied operational remediation and verified service health."]),
            "lessons_learned": ["Verify recovery metrics post-incident.", "Document runbook steps for fast recovery."],
            "prevention_steps": ["Enhance proactive monitoring and metric alerting thresholds."]
        }
    return {"message": "Incident marked as resolved", "status": "Resolved"}

@router.post("/{incident_id}/reopen")
async def reopen_incident(incident_id: str):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    MOCK_INCIDENTS[incident_id]["status"] = "Active"
    return {"message": "Incident reopened", "status": "Active"}

@router.post("/{incident_id}/analyze", response_model=AnalysisResult)
async def analyze_incident(incident_id: str):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Return cached analysis if available
    if incident_id in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[incident_id]
    
    incident = MOCK_INCIDENTS[incident_id]
    
    try:
        analysis = analyze_incident_with_groq(incident["title"], incident["description"])
        ANALYSIS_CACHE[incident_id] = analysis
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Groq AI: {str(e)}")

@router.post("/{incident_id}/feedback")
async def submit_feedback(incident_id: str, feedback: IncidentFeedback):
    if incident_id not in MOCK_INCIDENTS:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    status = "Resolved" if feedback.success else "Active"
    MOCK_INCIDENTS[incident_id]["status"] = status
    
    # Auto-generate post-mortem on resolution
    if feedback.success and incident_id not in POST_MORTEMS:
        inc = MOCK_INCIDENTS[incident_id]
        analysis = ANALYSIS_CACHE.get(incident_id, {})
        now = datetime.now().strftime("%b %d, %Y - %I:%M %p")
        POST_MORTEMS[incident_id] = {
            "incident_id": incident_id,
            "title": inc["title"],
            "severity": inc["severity"],
            "resolved_at": now,
            "summary": analysis.get("summary", f"Incident '{inc['title']}' was investigated and resolved."),
            "root_causes": analysis.get("root_causes", ["Root cause analysis pending."]),
            "solutions_applied": analysis.get("suggested_solutions", ["Solution details pending."]),
            "lessons_learned": ["Document findings for future reference.", "Update runbooks with resolution steps."],
            "prevention_steps": ["Set up monitoring to detect this issue earlier.", "Add automated alerts for related metrics."]
        }
    
    return {"message": "Feedback recorded", "status": status}

@router.get("/{incident_id}/post-mortem", response_model=PostMortemReport)
async def get_post_mortem(incident_id: str):
    if incident_id not in POST_MORTEMS:
        raise HTTPException(status_code=404, detail="Post-mortem not found for this incident")
    return POST_MORTEMS[incident_id]
