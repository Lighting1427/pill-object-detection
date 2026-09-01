import { useEffect, useRef, useState } from "react";

interface FileDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  onError: (message: string) => void;
}

const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileDropzone({ file, onChange, onError }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptFile = (candidate?: File) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) return onError("กรุณาเลือกไฟล์ภาพ JPG, PNG หรือ WEBP");
    if (candidate.size > MAX_BYTES) return onError("ไฟล์ใหญ่เกิน 25 MB");
    onChange(candidate);
  };

  if (file) {
    return (
      <div className="file-preview">
        <img src={previewUrl} alt="ภาพที่เลือก" />
        <div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
        <button className="icon-button" type="button" onClick={() => onChange(null)} aria-label="นำภาพออก">×</button>
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" onChange={(event) => acceptFile(event.target.files?.[0])} />
      <div className="upload-symbol" />
      <strong>วางภาพที่นี่</strong><p>หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</p><small>ขนาดไฟล์ไม่เกิน 25 MB</small>
    </div>
  );
}

