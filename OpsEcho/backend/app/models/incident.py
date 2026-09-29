from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str

class IncidentFeedback(BaseModel):
    success: bool

class Incident(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    time: str

class AnalysisResult(BaseModel):
    summary: str
    root_causes: List[str]
    suggested_solutions: List[str]

class PostMortemReport(BaseModel):
    incident_id: str
    title: str
    severity: str
    resolved_at: str
    summary: str
    root_causes: List[str]
    solutions_applied: List[str]
    lessons_learned: List[str]
    prevention_steps: List[str]

class Learning(BaseModel):
    id: str
    incident_id: str
    category: str
    insight: str
    created_at: str

class LearningCreate(BaseModel):
    category: str
    insight: str
    incident_id: Optional[str] = "GENERAL"
