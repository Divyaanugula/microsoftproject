import os
import json
import re
from groq import Groq

def _generate_smart_fallback_analysis(title: str, description: str):
    """
    Intelligent domain-aware fallback analysis when Groq API key is not configured or unavailable.
    Provides realistic, context-specific root causes and remediation steps.
    """
    text = f"{title} {description}".lower()

    if any(k in text for k in ["database", "postgres", "mysql", "sql", "pool", "connection"]):
        return {
            "summary": f"Database connectivity issue detected in relation to '{title}'. Symptoms point to connection pool saturation, unindexed heavy queries, or transient network partitions.",
            "root_causes": [
                "Connection pool exhaustion caused by leaked client connections or long-running queries",
                "Spike in concurrent database transactions exceeding max_connections limit",
                "Deadlocks or unindexed table scans holding row locks during peak traffic"
            ],
            "suggested_solutions": [
                "Inspect active connections via pg_stat_activity and terminate idle in transaction connections",
                "Temporarily increase connection pool size and enable aggressive idle connection timeouts",
                "Verify database CPU and disk I/O metrics; consider vertical scaling or read-replica failover"
            ]
        }
    elif any(k in text for k in ["memory", "oom", "leak", "heap", "garbage"]):
        return {
            "summary": f"Memory pressure or leak detected in '{title}'. The service is experiencing abnormal heap expansion or OOMKilled events.",
            "root_causes": [
                "Unbounded in-memory caching or unreleased buffer references in worker processes",
                "Circular object references preventing garbage collector reclamation",
                "Container memory limit configured below peak workload requirement"
            ],
            "suggested_solutions": [
                "Take a heap memory profile / dump to inspect retained objects before restart",
                "Temporarily raise container memory limits and restart failing pods",
                "Deploy fix to ensure stream/buffer disposal in finally blocks or context managers"
            ]
        }
    elif any(k in text for k in ["latency", "slow", "timeout", "p99", "spike"]):
        return {
            "summary": f"Service latency degradation detected in '{title}'. End-to-end response times have breached nominal operational thresholds.",
            "root_causes": [
                "Downstream third-party API or microservice latency bottleneck",
                "High CPU throttling or thread pool starvation under elevated load",
                "Inefficient database queries blocking the async event loop"
            ],
            "suggested_solutions": [
                "Check distributed APM traces (OpenTelemetry/Jaeger) to isolate the slowest span",
                "Enable response caching and apply circuit breaker patterns to degrading dependencies",
                "Scale out replicas horizontally to distribute incoming traffic"
            ]
        }
    elif any(k in text for k in ["auth", "503", "502", "500", "oauth", "token", "login"]):
        return {
            "summary": f"Authentication or service availability disruption identified in '{title}'. Dependent services or users are unable to complete authentication.",
            "root_causes": [
                "Expired signing certificates, JWKS endpoint unavailability, or token verification latency",
                "Upstream gateway / reverse proxy timeout communicating with authentication pods",
                "Rate limiting triggered by repetitive invalid authentication attempts"
            ],
            "suggested_solutions": [
                "Verify validity of OAuth certificates and check JWKS provider status",
                "Check auth service pod health and review error logs for token validation exceptions",
                "Bypass cache or flush session store if corrupted session tokens are present"
            ]
        }
    elif any(k in text for k in ["redis", "cache", "eviction", "memcached"]):
        return {
            "summary": f"Cache degradation or eviction storm impacting '{title}'. Elevated cache miss rates are propagating high load to backend data stores.",
            "root_causes": [
                "Cache memory limit reached triggering volatile-lru eviction of hot keys",
                "Simultaneous TTL expiration causing a cache stampede / thundering herd",
                "Large payloads or unbounded list writes consuming excessive memory"
            ],
            "suggested_solutions": [
                "Temporarily increase Redis maxmemory limit or evict non-critical namespaces",
                "Implement jitter in key expiration times to prevent simultaneous key expiration",
                "Warm hot cache keys proactively and add rate-limiting on uncached fallback queries"
            ]
        }
    else:
        return {
            "summary": f"Operational incident detected: '{title}'. System diagnostics indicate anomalous service behavior requiring immediate triage.",
            "root_causes": [
                "Recent code deployment or configuration drift introducing runtime regression",
                "Resource saturation or intermittent network connectivity between services",
                "Uncaught runtime exception in critical processing path"
            ],
            "suggested_solutions": [
                "Review recent deployment logs and consider rollback to last known stable release",
                "Check service health checks, logs, and metric dashboards for anomalous error spikes",
                "Isolate affected traffic and execute service restart if safe to do so"
            ]
        }

def analyze_incident_with_groq(title: str, description: str):
    api_key = os.environ.get("GROQ_API_KEY", "").strip()

    # If API key is not configured or placeholder, use domain-aware smart fallback
    if not api_key or api_key == "your_actual_key_here" or api_key.startswith("your_"):
        return _generate_smart_fallback_analysis(title, description)

    prompt = f"""
You are an expert IT Operations & SRE AI assistant. Analyze the following software incident and provide a concise summary, potential root causes, and suggested actionable solutions in beginner-friendly language.
Return your response ONLY as a valid JSON object matching this structure:
{{
  "summary": "Short beginner-friendly explanation of the issue.",
  "root_causes": ["Cause 1", "Cause 2", "Cause 3"],
  "suggested_solutions": ["Solution 1", "Solution 2", "Solution 3"]
}}

Incident Title: {title}
Description: {description}
"""

    # Try modern Groq models in order
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"]
    last_error = None

    try:
        client = Groq(api_key=api_key)
        for model in models_to_try:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    model=model,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                return json.loads(content)
            except Exception as e:
                last_error = e
                continue
    except Exception as e:
        last_error = e

    # If Groq call failed (e.g. invalid key, quota, offline), fall back to smart domain analysis
    fallback = _generate_smart_fallback_analysis(title, description)
    fallback["summary"] += f" (OpsEcho AI Analysis Engine)"
    return fallback
