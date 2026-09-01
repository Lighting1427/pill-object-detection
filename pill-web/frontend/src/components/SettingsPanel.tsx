import type { DetectionSettings } from "../types";

interface SettingsPanelProps {
  value: DetectionSettings;
  onChange: (value: DetectionSettings) => void;
}

export function SettingsPanel({ value, onChange }: SettingsPanelProps) {
  const patch = (next: Partial<DetectionSettings>) => onChange({ ...value, ...next });
  return (
    <details className="advanced">
      <summary>ตั้งค่าการตรวจจับ <span>ปรับแต่ง</span></summary>
      <div className="settings-grid">
        <label><span>Confidence <output>{value.confidence.toFixed(2)}</output></span><input type="range" min="0.05" max="0.9" step="0.05" value={value.confidence} onChange={(event) => patch({ confidence: Number(event.target.value) })} /></label>
        <label><span>IoU <output>{value.iou.toFixed(2)}</output></span><input type="range" min="0.1" max="0.95" step="0.05" value={value.iou} onChange={(event) => patch({ iou: Number(event.target.value) })} /></label>
        <label className="number-field"><span>จำนวนสูงสุด</span><input type="number" min="1" max="1000" value={value.maxDet} onChange={(event) => patch({ maxDet: Number(event.target.value) })} /></label>
      </div>
    </details>
  );
}

