"use client";

import { useSwarm } from "@/lib/store";

export default function EventLog() {
  const log = useSwarm((s) => s.log);

  return (
    <div className="panel reveal" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="panel-title">
        <span>◢ EVENT LOG</span>
        <span className="mono blink" style={{ color: "var(--green)", fontSize: 10 }}>● REC</span>
      </div>
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 12px" }}>
        {log.length === 0 && (
          <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
            // mesh nominal — awaiting events
          </div>
        )}
        {log.map((e, i) => {
          const color =
            e.alert.level === "critical" ? "var(--red)" :
            e.alert.level === "warning" ? "var(--amber)" : "var(--green)";
          const ts = new Date(e.ts).toLocaleTimeString("en-US", { hour12: false });
          return (
            <div key={i} className="mono" style={{ fontSize: 10, lineHeight: 1.5, color }}>
              <span style={{ color: "var(--text-dim)" }}>{ts} </span>
              {e.alert.msg}
            </div>
          );
        })}
      </div>
    </div>
  );
}
