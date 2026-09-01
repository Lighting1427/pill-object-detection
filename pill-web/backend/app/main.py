from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import predictions, system
from app.services.model_registry import model_registry


@asynccontextmanager
async def lifespan(_: FastAPI):
    model_registry.preload_all(warmup=True)
    yield


app = FastAPI(
    title="PillVision API",
    description="Inference API for trained Ultralytics YOLO pill detectors",
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(system.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"service": "PillVision API", "docs": "/docs", "health": "/api/health"}
