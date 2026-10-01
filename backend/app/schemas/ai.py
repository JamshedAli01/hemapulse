from pydantic import BaseModel, ConfigDict
from app.models.enums import RequestUrgency
from typing import Optional


class AnalyzeRequest(BaseModel):
    request_id: int
    description: str


class CheckDuplicateRequest(BaseModel):
    request_id: int


class AIAnalysisResponse(BaseModel):
    request_id: int
    urgency: Optional[RequestUrgency]
    summary: Optional[str]
    is_duplicate: Optional[bool]
    duplicate_request_id: Optional[int]
    duplicate_confidence: Optional[float]
    ai_provider: Optional[str]
    ai_model: Optional[str]

    model_config = ConfigDict(from_attributes=True)
