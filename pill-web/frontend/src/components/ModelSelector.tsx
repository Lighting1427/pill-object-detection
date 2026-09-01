import type { ModelInfo } from "../types";

interface ModelSelectorProps {
  models: ModelInfo[];
  selected: string;
  compareAvailable: boolean;
  onChange: (model: string) => void;
}

function Choice({ value, selected, title, detail, tag, onChange }: { value: string; selected: string; title: string; detail: string; tag: string; onChange: (value: string) => void }) {
  return (
    <label className="model-option">
      <input type="radio" name="model" value={value} checked={selected === value} onChange={() => onChange(value)} />
      <span className="model-card"><i className="radio-indicator" /><span className="model-copy"><strong>{title}</strong><small>{detail}</small></span><span className="model-tag">{tag}</span></span>
    </label>
  );
}

export function ModelSelector({ models, selected, compareAvailable, onChange }: ModelSelectorProps) {
  if (!models.length) return <div className="skeleton-stack"><div /><div /></div>;
  return (
    <div className="model-options">
      {models.map((model) => <Choice key={model.id} value={model.id} selected={selected} title={model.label} detail={`${model.description} · ${model.size_mb} MB · ${model.loaded ? "พร้อมใช้งาน" : "กำลังโหลด"}`} tag={`${model.imgsz}px`} onChange={onChange} />)}
      {compareAvailable && <Choice value="__compare__" selected={selected} title="เปรียบเทียบทั้งสองโมเดล" detail="ประมวลผลต่อเนื่องและแสดงผลคู่กัน" tag="A / B" onChange={onChange} />}
    </div>
  );
}
