from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.inference import classifier
from app.core.config import settings
from app.models.schemas import PredictRequest, PredictionResult, FaultEvent, MachineHealth
from app.models.database import get_db, FaultEventDB

router = APIRouter()


@router.post("/predict", response_model=PredictionResult, tags=["Inference"])
def predict(req: PredictRequest, db: Session = Depends(get_db)):
    """Run fault classification on a single 1024-sample vibration window."""
    result = classifier.predict(req.signal)
    now    = datetime.utcnow()

    event = FaultEventDB(
        machine_id  = req.machine_id,
        fault_class = result["fault_class"],
        fault_id    = result["fault_id"],
        confidence  = result["confidence"],
        is_fault    = result["is_fault"],
        latency_ms  = result["latency_ms"],
        timestamp   = now,
    )
    db.add(event)
    db.commit()

    return PredictionResult(**result, machine_id=req.machine_id, timestamp=now)


@router.get("/history", response_model=List[FaultEvent], tags=["History"])
def get_history(
    machine_id : Optional[str] = None,
    fault_class: Optional[str] = None,
    faults_only: bool = False,
    hours      : int  = Query(24, ge=1, le=720),
    limit      : int  = Query(100, ge=1, le=1000),
    db         : Session = Depends(get_db),
):
    """Fetch fault event history with optional filters."""
    since = datetime.utcnow() - timedelta(hours=hours)
    q     = db.query(FaultEventDB).filter(FaultEventDB.timestamp >= since)

    if machine_id:
        q = q.filter(FaultEventDB.machine_id == machine_id)
    if fault_class:
        q = q.filter(FaultEventDB.fault_class == fault_class)
    if faults_only:
        q = q.filter(FaultEventDB.is_fault == True)

    return q.order_by(FaultEventDB.timestamp.desc()).limit(limit).all()


@router.get("/health/{machine_id}", response_model=MachineHealth, tags=["Health"])
def machine_health(machine_id: str, db: Session = Depends(get_db)):
    """Get health score and status for a specific machine."""
    since = datetime.utcnow() - timedelta(hours=24)
    events = (
        db.query(FaultEventDB)
        .filter(FaultEventDB.machine_id == machine_id, FaultEventDB.timestamp >= since)
        .order_by(FaultEventDB.timestamp.desc())
        .all()
    )

    if not events:
        return MachineHealth(
            machine_id=machine_id, health_score=100.0,
            last_fault_class="Normal", last_fault_time=None,
            fault_count_24h=0, status="healthy",
        )

    fault_events = [e for e in events if e.is_fault]
    fault_count  = len(fault_events)
    total        = len(events)

    # Health score: penalise by fault rate and confidence
    fault_rate   = fault_count / total if total else 0
    avg_conf     = sum(e.confidence for e in fault_events) / fault_count if fault_count else 0
    health_score = max(0.0, 100.0 - fault_rate * 80 - avg_conf * 20)

    status = "healthy" if health_score > 75 else ("warning" if health_score > 40 else "critical")
    last   = events[0]

    return MachineHealth(
        machine_id      = machine_id,
        health_score    = round(health_score, 2),
        last_fault_class= last.fault_class,
        last_fault_time = last.timestamp,
        fault_count_24h = fault_count,
        status          = status,
    )


@router.get("/model/metrics", tags=["Model"])
def model_metrics():
    """Return model metadata and class info."""
    return {
        "model"       : "CNN-LSTM+Attention",
        "num_classes" : settings.NUM_CLASSES,
        "class_names" : settings.CLASS_NAMES,
        "window_size" : settings.WINDOW_SIZE,
        "sample_rate" : settings.SAMPLE_RATE,
        "framework"   : "ONNX Runtime",
    }


@router.get("/machines", tags=["Health"])
def list_machines(db: Session = Depends(get_db)):
    """List all machines that have sent data."""
    rows = db.query(FaultEventDB.machine_id).distinct().all()
    return {"machines": [r.machine_id for r in rows]}
