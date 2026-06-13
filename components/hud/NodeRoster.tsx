"use client";

import { useSwarm } from "@/lib/store";
import { killNode } from "@/lib/socket";

export default function NodeRoster() {
  const agents = useSwarm((s) => s.agents);

  return (
    <div className="panel reveal" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 120 }}>
      <div className="panel-title">
        <span>◢ NODE ROSTER</span>
        <span className="mono" style={{ color: "var(--text-dim)", fontSize: 10 }}>{agents.length} UNITS</span>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {agents.map((a) => {
          const c = a.status === "down" ? "var(--red)" : a.status === "isolated" ? "var(--amber)" : "var(--green)";
          return (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "14px 1fr 38px 44px 20px",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderBottom: "1px solid rgba(57,255,122,0.06)",
                opacity: a.status === "down" ? 0.55 : 1,
              }}
            >
              <span className={`dot dot-${a.status}`} />
              <span className="mono" style={{ fontSize: 11, color: "var(--text)" }}>
                {a.id}
                <span style={{ color: "var(--text-dim)", marginLeft: 6, fontSize: 9 }}>
                  {a.type.toUpperCase()}
                </span>
              </span>
              <span className="mono" style={{ fontSize: 10, color: c, textAlign: "right" }}>
                {a.status === "down" ? "—" : `${a.loc_error_cm}cm`}
              </span>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", textAlign: "right" }}>
                {a.status === "down" ? "OFFLINE" : `${a.neighbors.length}LNK`}
              </span>
              <button
                title="Sever node link"
                onClick={() => killNode(a.id)}
                disabled={a.status === "down"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: a.status === "down" ? "var(--text-dim)" : "var(--red)",
                  cursor: a.status === "down" ? "default" : "pointer",
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
