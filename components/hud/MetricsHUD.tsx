"use client";

import { useSwarm } from "@/lib/store";

export default function MetricsHUD() {
  const m = useSwarm((s) => s.metrics);
  const survivors = useSwarm((s) => s.survivors);
  const found = survivors.filter((s) => s.confidence > 0.3).length;

  const err = m?.mean_loc_error_cm ?? 0;
  const coverage = (m?.coverage_pct ?? 0) * 100;

  return (
    <div className="panel reveal" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="panel-title">
        <span>◢ MISSION TELEMETRY</span>
        <span className="mono" style={{ color: "var(--text-dim)", fontSize: 10 }}>ZERO-GPS</span>
      </div>
      <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, overflowY: "auto", alignContent: "start" }}>
        <Gauge
          label="LOCALIZATION ERR"
          value={`${err.toFixed(1)}`}
          unit="cm"
          target="< 15cm"
          pct={Math.min(1, err / 30)}
          good={err < 15}
        />
        <Gauge
          label="AREA MAPPED"
          value={`${coverage.toFixed(0)}`}
          unit="%"
          target="frontier"
          pct={coverage / 100}
          good
        />
        <Gauge
          label="MESH INTEGRITY"
          value={`${Math.round((m?.connectivity ?? 0) * 100)}`}
          unit="%"
          target="self-heal"
          pct={m?.connectivity ?? 0}
          good={(m?.connectivity ?? 0) > 0.5}
        />
        <Gauge
          label="SURVIVORS"
          value={`${found}`}
          unit={`/ ${survivors.length || 5}`}
          target="thermal"
          pct={found / 5}
          good={found > 0}
          accent="var(--amber)"
        />
      </div>
    </div>
  );
}

function Gauge({
  label, value, unit, target, pct, good, accent,
}: {
  label: string; value: string; unit: string; target: string; pct: number; good?: boolean; accent?: string;
}) {
  const color = accent ?? (good ? "var(--green)" : "var(--amber)");
  return (
    <div style={{ border: "1px solid var(--hair)", padding: "9px 10px", background: "rgba(0,0,0,0.2)" }}>
      <div className="mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.14em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "3px 0 6px" }}>
        <span className="display glow" style={{ fontSize: 26, color, letterSpacing: "0.02em" }}>{value}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{unit}</span>
      </div>
      <div style={{ height: 4, background: "rgba(57,255,122,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(3, pct * 100)}%`, background: color, boxShadow: `0 0 8px ${color}`, transition: "width 0.3s ease" }} />
      </div>
      <div className="mono" style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 4, letterSpacing: "0.12em" }}>{target}</div>
    </div>
  );
}
