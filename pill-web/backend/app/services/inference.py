from __future__ import annotations

import base64
import io
import threading
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from app.config import MODEL_PROFILES, settings
from app.schemas import Detection, ModelPrediction
from app.services.model_registry import model_registry


_inference_lock = threading.Lock()


def _encode_image(image: Image.Image) -> str:
    output = io.BytesIO()
    display_image = image.copy()
    display_image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
    display_image.save(output, format="JPEG", quality=91, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def _class_name(names: dict | list, class_id: int) -> str:
    return str(names.get(class_id, class_id) if isinstance(names, dict) else names[class_id])


def _annotation_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a readable font without making the API depend on one OS path."""
    candidates = (
        "arial.ttf",
        "Arial.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _draw_annotations(image: Image.Image, detections: list[Detection]) -> Image.Image:
    """Draw compact, text-free detection annotations for the result preview."""
    annotated = image.convert("RGB").copy()
    draw = ImageDraw.Draw(annotated)
    width, height = annotated.size
    line_width = max(2, round(min(width, height) / 500))
    marker_font = _annotation_font(max(12, round(min(width, height) / 45)))
    box_color = (44, 190, 126)
    marker_color = (20, 92, 66)
    text_color = (255, 255, 255)

    for detection in detections:
        x1, y1, x2, y2 = detection.box
        left = max(0, min(width - 1, round(x1)))
        top = max(0, min(height - 1, round(y1)))
        right = max(left, min(width - 1, round(x2)))
        bottom = max(top, min(height - 1, round(y2)))
        draw.rectangle((left, top, right, bottom), outline=box_color, width=line_width)

        label = str(detection.index)
        text_box = draw.textbbox((0, 0), label, font=marker_font)
        padding = max(3, line_width)
        marker_width = text_box[2] - text_box[0] + padding * 2
        marker_height = text_box[3] - text_box[1] + padding * 2
        marker_left = min(left, max(0, width - marker_width))
        marker_top = top - marker_height if top >= marker_height else top
        marker_top = max(0, marker_top)
        marker_right = min(width, marker_left + marker_width)
        marker_bottom = min(height, marker_top + marker_height)
        draw.rectangle((marker_left, marker_top, marker_right, marker_bottom), fill=marker_color)
        draw.text(
            (marker_left + padding - text_box[0], marker_top + padding - text_box[1]),
            label,
            fill=text_color,
            font=marker_font,
        )

    return annotated


def run_model(
    image: Image.Image,
    filename: str,
    confidence: float,
    iou: float,
    max_det: int,
) -> ModelPrediction:
    profile = MODEL_PROFILES[filename]
    model = model_registry.get(filename)
    started = time.perf_counter()
    with _inference_lock:
        result = model.predict(
            source=np.asarray(image),
            imgsz=profile.imgsz,
            conf=confidence,
            iou=iou,
            max_det=max_det,
            verbose=False,
        )[0]
    elapsed_ms = (time.perf_counter() - started) * 1000
    detections: list[Detection] = []

    if result.boxes is not None and len(result.boxes):
        xyxy = result.boxes.xyxy.detach().cpu().numpy()
        confidences = result.boxes.conf.detach().cpu().numpy()
        classes = result.boxes.cls.detach().cpu().numpy().astype(int)
        for index, (coords, score, class_id) in enumerate(zip(xyxy, confidences, classes), start=1):
            detections.append(
                Detection(
                    index=index,
                    class_id=int(class_id),
                    class_name=_class_name(result.names, int(class_id)),
                    confidence=round(float(score), 4),
                    box=[round(float(value), 1) for value in coords.tolist()],
                )
            )

    plotted_rgb = _draw_annotations(image, detections)
    speed = result.speed or {}
    return ModelPrediction(
        model_id=filename,
        model_label=profile.label,
        imgsz=profile.imgsz,
        count=len(detections),
        latency_ms=round(elapsed_ms, 1),
        inference_ms=round(float(speed.get("inference", elapsed_ms)), 1),
        detections=detections,
        image=_encode_image(plotted_rgb),
    )


def predict_selected(
    image: Image.Image,
    selected_model: str,
    confidence: float,
    iou: float,
    max_det: int,
) -> list[ModelPrediction]:
    available = [item.id for item in model_registry.available()]
    if selected_model == settings.compare_value:
        selected = available
    elif selected_model in available:
        selected = [selected_model]
    else:
        raise ValueError("กรุณาเลือกโมเดลที่พร้อมใช้งาน")
    return [run_model(image, model_id, confidence, iou, max_det) for model_id in selected]
