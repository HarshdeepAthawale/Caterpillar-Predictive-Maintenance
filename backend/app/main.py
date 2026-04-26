from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import router
from app.api.websocket import ws_router
from app.models.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    print(f"✅ {settings.APP_NAME} v{settings.VERSION} started")
    yield
    print("🔴 Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Real-time bearing fault detection API using CNN-LSTM + Attention",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(ws_router, prefix="/ws")


@app.get("/", tags=["Root"])
def root():
    return {
        "app"    : settings.APP_NAME,
        "version": settings.VERSION,
        "docs"   : "/docs",
        "health" : "/api/v1/model/metrics",
    }
