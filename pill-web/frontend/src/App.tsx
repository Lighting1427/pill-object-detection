import { useEffect, useState } from "react";
import { FileDropzone } from "./components/FileDropzone";
import { Header } from "./components/Header";
import { ModelSelector } from "./components/ModelSelector";
import { ResultsPanel } from "./components/ResultsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { getModels, predictImage } from "./services/api";
import type { DetectionSettings, ModelInfo, PredictionResponse } from "./types";

const DEFAULT_SETTINGS: DetectionSettings = { confidence: 0.25, iou: 0.7, maxDet: 500 };

export default function App() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [compareAvailable, setCompareAvailable] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const connect = async (attempt = 0) => {
      try {
        const data = await getModels();
        if (cancelled) return;
        const readyModels = data.models.filter((model) => model.loaded);
        if (!readyModels.length) throw new Error("Backend ยังโหลดโมเดลไม่เสร็จ");
        setModels(readyModels);
        setCompareAvailable(data.compare_available && readyModels.length > 1);
        setSelectedModel((current) => current || readyModels[0].id);
        setStatus("online");
      } catch (error) {
        if (cancelled) return;
        if (attempt < 20) {
          setStatus("connecting");
          retryTimer = window.setTimeout(() => connect(attempt + 1), 1500);
        } else {
          setStatus("offline");
          setToast(error instanceof Error ? error.message : "เชื่อมต่อ backend ไม่สำเร็จ");
        }
      }
    };
    connect();
    return () => { cancelled = true; if (retryTimer) window.clearTimeout(retryTimer); };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 4200); return () => window.clearTimeout(timer); }, [toast]);

  const detect = async () => {
    if (!file || !selectedModel) return;
    setLoading(true); setResult(null);
    try { setResult(await predictImage(file, selectedModel, settings)); }
    catch (error) { setToast(error instanceof Error ? error.message : "เกิดข้อผิดพลาดระหว่างตรวจจับ"); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return <>
    <div className="noise" aria-hidden="true" />
    <Header status={status} modelCount={models.length} />
    <main>
      <section className="hero"><div><div className="eyebrow">YOLO · COMPUTER VISION</div><h1>ตรวจจับเม็ดยา<br /><em>ในภาพเดียว</em></h1></div><div className="hero-copy"><p>อัปโหลดภาพ เลือกโมเดล แล้วเปรียบเทียบผลตรวจจับพร้อมค่าความมั่นใจได้ทันที</p><div className="hero-meta"><span><b>02</b> trained models</span><span><b>500</b> max detections</span><span><b>25 MB</b> max upload</span></div></div></section>
      <section className="workspace">
        <aside className="control-panel">
          <div className="step-heading"><span>01</span><div><h2>เพิ่มภาพ</h2><p>JPG, PNG หรือ WEBP</p></div></div>
          <FileDropzone file={file} onChange={setFile} onError={setToast} />
          <div className="divider" />
          <div className="step-heading"><span>02</span><div><h2>เลือกโมเดล</h2><p>เลือกหนึ่งรุ่นหรือเปรียบเทียบ</p></div></div>
          <ModelSelector models={models} selected={selectedModel} compareAvailable={compareAvailable} onChange={setSelectedModel} />
          <SettingsPanel value={settings} onChange={setSettings} />
          <button className="primary-button" type="button" disabled={!file || !selectedModel || loading} onClick={detect}><span>{loading ? "กำลังประมวลผล…" : "เริ่มตรวจจับ"}</span><span>↗</span></button>
          <p className="privacy-note">ภาพถูกประมวลผลบนเซิร์ฟเวอร์นี้และไม่ถูกบันทึกถาวร</p>
        </aside>
        <ResultsPanel loading={loading} data={result} onReset={reset} />
      </section>
    </main>
    <footer><span>PillVision / AI Quality Inspection</span><span>React + FastAPI + Ultralytics YOLO</span></footer>
    <div className={`toast ${toast ? "show" : ""}`} role="alert" aria-live="assertive">{toast}</div>
  </>;
}
