from __future__ import annotations

import io

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import settings
from app.schemas import PredictionResponse
from app.services.inference import predict_selected


router = APIRouter(tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    model: str = Form(...),
    confidence: float = Form(0.25),
    iou: float = Form(0.70),
    max_det: int = Form(500),
) -> PredictionResponse:
    if not 0.01 <= confidence <= 0.99:
        raise HTTPException(status_code=422, detail="confidence ต้องอยู่ระหว่าง 0.01–0.99")
    if not 0.10 <= iou <= 0.95:
        raise HTTPException(status_code=422, detail="IoU ต้องอยู่ระหว่าง 0.10–0.95")
    if not 1 <= max_det <= 1000:
        raise HTTPException(status_code=422, detail="max_det ต้องอยู่ระหว่าง 1–1000")

    raw = await file.read(settings.max_upload_bytes + 1)
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="ไฟล์ใหญ่เกิน 25 MB")
    if not raw:
        raise HTTPException(status_code=400, detail="ไฟล์ว่างเปล่า")
    try:
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=415, detail="ไฟล์นี้ไม่ใช่ภาพที่รองรับ") from exc
    if image.width * image.height > settings.max_image_pixels:
        raise HTTPException(status_code=413, detail="ความละเอียดภาพสูงเกิน 60 ล้านพิกเซล")

    try:
        results = await run_in_threadpool(
            predict_selected,
            image,
            model,
            confidence,
            iou,
            max_det,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    return PredictionResponse(
        filename=file.filename or "uploaded-image",
        width=image.width,
        height=image.height,
        confidence=confidence,
        iou=iou,
        results=results,
    )

