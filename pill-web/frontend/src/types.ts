export interface ModelInfo {
  id: string;
  label: string;
  description: string;
  imgsz: number;
  size_mb: number;
  loaded: boolean;
}

export interface Detection {
  index: number;
  class_id: number;
  class_name: string;
  confidence: number;
  box: [number, number, number, number];
}

export interface ModelPrediction {
  model_id: string;
  model_label: string;
  imgsz: number;
  count: number;
  latency_ms: number;
  inference_ms: number;
  detections: Detection[];
  image: string;
}

export interface PredictionResponse {
  filename: string;
  width: number;
  height: number;
  confidence: number;
  iou: number;
  results: ModelPrediction[];
}

export interface DetectionSettings {
  confidence: number;
  iou: number;
  maxDet: number;
}
