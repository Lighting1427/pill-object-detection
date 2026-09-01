from __future__ import annotations

from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    label: str
    description: str
    imgsz: int
    size_mb: float
    loaded: bool


class Detection(BaseModel):
    index: int
    class_id: int
    class_name: str
    confidence: float
    box: list[float]


class ModelPrediction(BaseModel):
    model_id: str
    model_label: str
    imgsz: int
    count: int
    latency_ms: float
    inference_ms: float
    detections: list[Detection]
    image: str


class PredictionResponse(BaseModel):
    filename: str
    width: int
    height: int
    confidence: float
    iou: float
    results: list[ModelPrediction]
