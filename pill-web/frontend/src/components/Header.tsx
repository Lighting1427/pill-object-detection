interface HeaderProps {
  status: "connecting" | "online" | "offline";
  modelCount: number;
}

export function Header({ status, modelCount }: HeaderProps) {
  const label = status === "online" ? `ระบบพร้อม · ${modelCount} โมเดล` : status === "offline" ? "ระบบยังไม่พร้อม" : "กำลังเชื่อมต่อระบบ";
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="PillVision home">
        <span className="brand-mark"><i /></span>
        <span><strong>PillVision</strong><small>Detection studio</small></span>
      </a>
      <div className={`service-state ${status}`} aria-live="polite">
        <span className="status-dot" /><span>{label}</span>
      </div>
    </header>
  );
}

