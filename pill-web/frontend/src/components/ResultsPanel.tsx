import type { PredictionResponse } from "../types";

interface ResultsPanelProps {
  loading: boolean;
  data: PredictionResponse | null;
  onReset: () => void;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export function ResultsPanel({ loading, data, onReset }: ResultsPanelProps) {
  if (loading) return <section className="result-panel"><div className="loading-state"><div className="scanner"><i /></div><strong>กำลังวิเคราะห์ภาพ</strong><p>ครั้งแรกอาจใช้เวลานานกว่าปกติเพราะกำลังโหลดโมเดล</p></div></section>;
  if (!data) return <section className="result-panel"><div className="empty-state"><div className="scan-frame"><span /><span /><span /><span /><i /></div><div><strong>พื้นที่แสดงผล</strong><p>ผลตรวจจับและกรอบตำแหน่งเม็ดยาจะปรากฏที่นี่</p></div></div></section>;

  const detections = data.results.flatMap((result) => result.detections.map((item) => ({ ...item, model: result.model_label })));
  const total = data.results.reduce((sum, result) => sum + result.count, 0);
  const fastest = Math.min(...data.results.map((result) => result.inference_ms));
  const downloadCsv = () => {
    const rows = [["model", "index", "class", "confidence", "x1", "y1", "x2", "y2"], ...detections.map((item) => [item.model, item.index, item.class_name, item.confidence, ...item.box])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadDataUrl(`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`, "pill-detections.csv");
  };

  return (
    <section className="result-panel"><div className="results">
      <div className="results-header"><div><div className="eyebrow">DETECTION RESULT</div><h2>ผลการวิเคราะห์</h2></div><button className="secondary-button" type="button" onClick={onReset}>วิเคราะห์ภาพใหม่</button></div>
      <div className="summary-strip">
        <div><span>ผลรวมที่ตรวจพบ</span><strong>{total}</strong></div><div><span>โมเดลที่ใช้</span><strong>{data.results.length}</strong></div><div><span>Inference เร็วสุด</span><strong>{fastest.toFixed(0)} ms</strong></div><div><span>ภาพต้นฉบับ</span><strong>{data.width}×{data.height}</strong></div>
      </div>
      <div className="result-grid">{data.results.map((result) => (
        <article className="result-card" key={result.model_id}>
          <div className="result-image"><img src={result.image} alt={`ผลตรวจจับจาก ${result.model_label}`} /><span>{result.count} detections</span></div>
          <p className="annotation-note">หมายเลขบนกรอบอ้างอิงกับรายการในตารางด้านล่าง</p>
          <div className="result-details"><div><strong>{result.model_label}</strong><p>{result.imgsz}px · inference {result.inference_ms.toFixed(1)} ms · total {result.latency_ms.toFixed(1)} ms</p></div><button type="button" onClick={() => downloadDataUrl(result.image, `${result.model_id.replace(".pt", "")}_${data.filename.replace(/\.[^.]+$/, "")}.jpg`)}>ดาวน์โหลดภาพ</button></div>
        </article>
      ))}</div>
      <section className="detection-list">
        <div className="table-heading"><div><h3>รายการที่ตรวจพบ</h3><p>เรียงตามโมเดลและค่าความมั่นใจ</p></div><button type="button" onClick={downloadCsv}>ดาวน์โหลด CSV</button></div>
        <div className="table-wrap"><table><thead><tr><th>โมเดล</th><th>#</th><th>คลาส</th><th>Confidence</th><th>Bounding box</th></tr></thead><tbody>{detections.length ? detections.map((item) => <tr key={`${item.model}-${item.index}`}><td>{item.model}</td><td>{item.index}</td><td>{item.class_name}</td><td><span className="confidence-pill">{(item.confidence * 100).toFixed(1)}%</span></td><td>[{item.box.map((value) => value.toFixed(1)).join(", ")}]</td></tr>) : <tr><td colSpan={5}>ไม่พบวัตถุที่ผ่านค่า confidence ที่กำหนด</td></tr>}</tbody></table></div>
      </section>
    </div></section>
  );
}
