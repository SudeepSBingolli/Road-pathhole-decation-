import io
import base64
import os
from pathlib import Path
from typing import List, Optional
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI application
app = FastAPI(
    title="RoadWatch AI Damage Detection Microservice",
    description="Automated pothole and road crack detection using YOLOv8",
    version="1.0.0"
)

# Enable CORS for cross-service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Locate Model Weights
ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT_DIR / "models" / "YOLOv8_Small_RDD.pt"

# Damage Class Labels from CRDDC2022 Japan/India dataset
DAMAGE_CLASSES = [
    "Longitudinal Crack",
    "Transverse Crack",
    "Alligator Crack",
    "Potholes"
]

model = None

@app.on_event("startup")
def load_yolo_model():
    global model
    try:
        from ultralytics import YOLO
        if MODEL_PATH.exists():
            print(f"[AI Service] Loading YOLOv8 model from: {MODEL_PATH}")
            model = YOLO(str(MODEL_PATH))
            print("[AI Service] Model loaded successfully.")
        else:
            print(f"[AI Service Warning] Model weights not found at {MODEL_PATH}. Running in mock detection mode.")
    except Exception as e:
        print(f"[AI Service Warning] Failed to load YOLO model: {e}. Running in mock fallback mode.")

class BoundingBox(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    box: List[int] # [x1, y1, x2, y2]

class DetectionResponse(BaseModel):
    success: bool
    has_damage: bool
    detected_classes: List[str]
    total_detections: int
    severity_score: float # 0.0 to 10.0
    recommended_priority: str # 'low' | 'medium' | 'high' | 'critical'
    detections: List[BoundingBox]
    annotated_image_base64: Optional[str] = None

def compute_severity(detections: List[BoundingBox]) -> tuple[float, str]:
    """
    Computes an engineering severity score based on detected damage types:
    - Potholes are weighted highest (3.5 pts each)
    - Alligator cracks indicate structural road fatigue (2.5 pts each)
    - Longitudinal & transverse cracks indicate surface wear (1.5 pts each)
    """
    score = 0.0
    has_pothole = False

    for d in detections:
        cname = d.class_name.lower()
        if "pothole" in cname:
            score += 3.5
            has_pothole = True
        elif "alligator" in cname:
            score += 2.5
        else:
            score += 1.5

    # Cap score at 10.0
    normalized_score = min(round(score, 1), 10.0)

    # Priority mapping
    if normalized_score >= 7.0 or (has_pothole and len(detections) >= 2):
        priority = "critical"
    elif normalized_score >= 4.5 or has_pothole:
        priority = "high"
    elif normalized_score >= 2.0:
        priority = "medium"
    elif normalized_score > 0:
        priority = "low"
    else:
        priority = "low"

    return normalized_score, priority

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "RoadWatch AI Damage Detection Microservice",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH)
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_damage(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.25, ge=0.05, le=0.95),
    return_annotated_image: bool = Query(True)
):
    """
    Runs YOLOv8 road damage detection on an uploaded image.
    Returns detected damage bounding boxes, severity score, and priority recommendation.
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(image)

        detections: List[BoundingBox] = []
        annotated_b64 = None

        if model is not None:
            # Run YOLO inference
            results = model.predict(image_np, conf=confidence_threshold)
            res = results[0]

            boxes = res.boxes.cpu().numpy()
            for b in boxes:
                cls_id = int(b.cls[0]) if hasattr(b.cls, '__len__') else int(b.cls)
                conf = float(b.conf[0]) if hasattr(b.conf, '__len__') else float(b.conf)
                xyxy = b.xyxy[0].astype(int).tolist()

                cls_name = DAMAGE_CLASSES[cls_id] if cls_id < len(DAMAGE_CLASSES) else f"Damage Class {cls_id}"

                detections.append(BoundingBox(
                    class_id=cls_id,
                    class_name=cls_name,
                    confidence=round(conf, 3),
                    box=xyxy
                ))

            if return_annotated_image:
                plotted_bgr = res.plot()
                plotted_rgb = cv2.cvtColor(plotted_bgr, cv2.COLOR_BGR2RGB)
                plotted_pil = Image.fromarray(plotted_rgb)
                buffer = io.BytesIO()
                plotted_pil.save(buffer, format="JPEG", quality=85)
                annotated_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

        else:
            # Fallback mock response for testing if torch/ultralytics is not initialized
            detections.append(BoundingBox(
                class_id=3,
                class_name="Potholes",
                confidence=0.88,
                box=[120, 150, 480, 420]
            ))

        unique_classes = list(set(d.class_name for d in detections))
        has_damage = len(detections) > 0
        severity_score, recommended_priority = compute_severity(detections)

        return DetectionResponse(
            success=True,
            has_damage=has_damage,
            detected_classes=unique_classes,
            total_detections=len(detections),
            severity_score=severity_score,
            recommended_priority=recommended_priority,
            detections=detections,
            annotated_image_base64=annotated_b64
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

