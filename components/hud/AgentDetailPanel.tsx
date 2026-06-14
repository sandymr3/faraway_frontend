"use client";

import { motion } from "framer-motion";
import { useSwarm } from "@/lib/store";
import type { Agent } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  active: "var(--green)",
  isolated: "var(--amber)",
  down: "var(--red)",
};

export default function AgentDetailPanel() {
  const selectedId = useSwarm((s) => s.selectedId);
  const agent = useSwarm((s) => s.agents.find((a) => a.id === s.selectedId));
  const select = useSwarm((s) => s.select);

  if (!selectedId || !agent) return null;

  return (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="panel"
      style={{
        position: "absolute",
        top: 44,
        right: 12,
        width: 270,
        zIndex: 46,
        background: "rgba(5, 12, 10, 0.92)",
      }}
    >
      <Body agent={agent} onClose={() => select(null)} />
    </motion.div>
  );
}

function Body({ agent: a, onClose }: { agent: Agent; onClose: () => void }) {
  const col = STATUS_COLOR[a.status] ?? "var(--green)";
  const hdg = ((a.yaw * 180) / Math.PI + 360) % 360;
  const sigmaCm = Math.sqrt(Math.max(0, (a.cov[0][0] + a.cov[1][1]) / 2)) * 2 * 100;
  const errGood = a.loc_error_cm < 15;

  return (
    <div>
      <div className="panel-title" style={{ borderColor: "var(--cyan)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--cyan)" }}>
          <span className={`dot dot-${a.status}`} /> {a.id}
        </span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 13 }}
          title="Deselect"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.14em" }}>
            {a.type.toUpperCase()} · {a.status.toUpperCase()}
          </span>
          <span className="display glow" style={{ fontSize: 13, color: col }}>
            {a.type === "uav" ? "◇ AERIAL" : "▢ GROUND"}
          </span>
        </div>

        {/* localization error sparkline */}
        <Sparkline id={a.id} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <Stat label="LOC ERROR" value={`${a.loc_error_cm}`} unit="cm" color={errGood ? "var(--green)" : "var(--amber)"} />
          <Stat label="UNCERTAINTY" value={`±${sigmaCm.toFixed(0)}`} unit="cm" />
          <Stat label="REL POS" value={`${a.pos_est[0].toFixed(1)}, ${a.pos_est[1].toFixed(1)}`} unit="m" />
          <Stat label="ALTITUDE" value={`${a.pos_est[2].toFixed(1)}`} unit="m" />
          <Stat label="HEADING" value={`${hdg.toFixed(0)}`} unit="°" />
          <Stat label="SPEED" value={`${a.vel[0].toFixed(1)}`} unit="m/s" />
        </div>

        {/* battery */}
        <div style={{ marginTop: 10 }}>
          <Label>BATTERY</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(57,255,122,0.08)" }}>
              <div style={{ height: "100%", width: `${a.battery * 100}%`, background: a.battery > 0.3 ? "var(--green)" : "var(--red)", boxShadow: "0 0 6px var(--green)" }} />
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--text)" }}>{Math.round(a.battery * 100)}%</span>
          </div>
        </div>

        {/* neighbors */}
        <div style={{ marginTop: 10 }}>
          <Label>UWB LINKS · {a.neighbors.length}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {a.neighbors.length === 0 && (
              <span className="mono" style={{ fontSize: 10, color: "var(--amber)" }}>◌ ISOLATED — dead-reckoning</span>
            )}
            {a.neighbors.map((n) => (
              <span
                key={n}
                onClick={() => useSwarm.getState().select(n)}
                className="mono"
                style={{ fontSize: 9, color: "var(--text-dim)", border: "1px solid var(--hair)", padding: "1px 5px", cursor: "pointer" }}
              >
                {n.replace("UAV_", "").replace("UGV_", "")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ id }: { id: string }) {
  const W = 244;
  const H = 44;
  const hist = useSwarm((s) => s.history); // subscribe (tear-safe) — not getState()
  const slice = hist.slice(-120);
  const vals = slice.map((f) => {
    const ag = f.agents.find((x) => x.id === id);
    return ag ? ag.loc_error_cm : 0;
  });
  const maxY = Math.max(20, ...vals) * 1.1;
  const n = vals.length;
  const pts =
    n > 1
      ? vals.map((v, i) => `${(i / (n - 1)) * W},${H - (v / maxY) * H}`).join(" ")
      : "";
  const y15 = H - (15 / maxY) * H;
  const last = vals[vals.length - 1] ?? 0;

  return (
    <div>
      <Label>LOCALIZATION ERROR · LAST {Math.round(n / 30)}s</Label>
      <svg width={W} height={H} style={{ display: "block", marginTop: 3, background: "rgba(0,0,0,0.25)", border: "1px solid var(--hair)" }}>
        {/* 15cm target threshold */}
        <line x1={0} y1={y15} x2={W} y2={y15} stroke="var(--amber)" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.7} />
        <text x={2} y={Math.max(8, y15 - 2)} fill="var(--amber)" fontSize={7} fontFamily="monospace" opacity={0.8}>15cm</text>
        {pts && <polyline points={pts} fill="none" stroke={last < 15 ? "var(--green)" : "var(--amber)"} strokeWidth={1.2} />}
      </svg>
    </div>
  );
}

function Stat({ label, value, unit, color = "var(--text)" }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div style={{ border: "1px solid var(--hair)", padding: "5px 7px", background: "rgba(0,0,0,0.2)" }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span className="display" style={{ fontSize: 15, color }}>{value}</span>
        <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)" }}>{unit}</span>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono" style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.14em" }}>
      {children}
    </div>
  );
}
