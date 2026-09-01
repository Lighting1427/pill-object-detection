import type { DetectionSettings, ModelInfo, PredictionResponse } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail ?? `Request failed (${response.status})`);
  }
  return payload as T;
}

export async function getModels(): Promise<{ models: ModelInfo[]; compare_available: boolean }> {
  return request("/api/models");
}

export async function getHealth(): Promise<{ status: string; models_available: number; models_loaded: number }> {
  return request("/api/health");
}

export async function predictImage(
  file: File,
  model: string,
  settings: DetectionSettings,
): Promise<PredictionResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("model", model);
  form.append("confidence", String(settings.confidence));
  form.append("iou", String(settings.iou));
  form.append("max_det", String(settings.maxDet));
  return request("/api/predict", { method: "POST", body: form });
}
