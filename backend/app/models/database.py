from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.core.config import settings

engine       = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


class FaultEventDB(Base):
    __tablename__ = "fault_events"

    id          = Column(Integer, primary_key=True, index=True)
    machine_id  = Column(String, index=True)
    fault_class = Column(String)
    fault_id    = Column(Integer)
    confidence  = Column(Float)
    is_fault    = Column(Boolean)
    latency_ms  = Column(Float)
    timestamp   = Column(DateTime, default=datetime.utcnow, index=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
