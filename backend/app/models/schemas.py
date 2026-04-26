from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class PredictRequest(BaseModel):
    signal: List[float] = Field(..., min_length=1024, max_length=1024,
                                 description="1024-sample vibration window (normalized or raw)")
    machine_id: Optional[str] = "machine_01"


class PredictionResult(BaseModel):
    fault_id: int
    fault_class: str
    confidence: float
    probabilities: Dict[str, float]
    latency_ms: float
    is_fault: bool
    machine_id: str
    timestamp: datetime


class FaultEvent(BaseModel):
    id: int
    machine_id: str
    fault_class: str
    fault_id: int
    confidence: float
    is_fault: bool
    latency_ms: float
    timestamp: datetime

    class Config:
        from_attributes = True


class MachineHealth(BaseModel):
    machine_id: str
    health_score: float          # 0-100
    last_fault_class: str
    last_fault_time: Optional[datetime]
    fault_count_24h: int
    status: str                  # "healthy" | "warning" | "critical"


class StreamMessage(BaseModel):
    type: str                    # "prediction" | "error" | "ping"
    data: Optional[dict] = None
