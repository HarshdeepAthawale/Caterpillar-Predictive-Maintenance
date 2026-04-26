from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Caterpillar Predictive Maintenance API"
    VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/caterpillar"
    REDIS_URL: str = "redis://localhost:6379"

    ONNX_MODEL_PATH: str = str(Path(__file__).resolve().parents[3] / "ai" / "models" / "fault_classifier.onnx")
    WINDOW_SIZE: int = 1024
    SAMPLE_RATE: int = 12000
    NUM_CLASSES: int = 4
    CLASS_NAMES: list = ["Normal", "Inner Race", "Ball Fault", "Outer Race"]

    INFERENCE_THRESHOLD: float = 0.6  # min confidence to raise alert

    class Config:
        env_file = ".env"


settings = Settings()
