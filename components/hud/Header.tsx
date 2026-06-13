"use client";

import { useSwarm } from "@/lib/store";

export default function Header() {
  const source = useSwarm((s) => s.source);
  const metrics = useSwarm((s) => s.metrics);
  const clock = useMissionClock();

  return (
    <header
      style={{
        height: 50,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 16px",
        borderBottom: "1px solid var(--hair)",
        background: "linear-gradient(90deg, rgba(57,255,122,0.05), transparent 40%)",
      }}
    >
      <div className="display glow" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.12em" }}>
        SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
      </div>
      <div className="mono" style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: "0.18em" }}>
        OPERATOR CONTROL · INCIDENT COMMAND
      </div>

      <div style={{ flex: 1 }} />

      <Stat label="MISSION TIME" value={clock} />
      <Stat label="ACTIVE" value={`${metrics?.agents_active ?? 0}`} color="var(--green)" />
      <Stat label="DOWN" value={`${metrics?.agents_down ?? 0}`} color={metrics?.agents_down ? "var(--red)" : "var(--text-dim)"} />
      <Stat
        label="LOC ERROR"
        value={`${metrics?.mean_loc_error_cm ?? 0}cm`}
        color={(metrics?.mean_loc_error_cm ?? 0) < 15 ? "var(--green)" : "var(--amber)"}
      />

      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 11px",
          border: `1px solid ${source === "live" ? "var(--green-dim)" : "var(--amber)"}`,
          fontSize: 10,
          letterSpacing: "0.16em",
          color: source === "live" ? "var(--green)" : "var(--amber)",
        }}
      >
        <span className={`dot ${source === "live" ? "dot-active" : "dot-isolated"} blink`} />
        {source === "live" ? "LIVE TELEMETRY" : "SIMULATED FEED"}
      </div>
    </header>
  );
}

function Stat({ label, value, color = "var(--text)" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.1 }}>
      <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.16em" }}>{label}</span>
      <span className="display glow" style={{ fontSize: 15, color, letterSpacing: "0.05em" }}>{value}</span>
    </div>
  );
}

import { useEffect, useState } from "react";
function useMissionClock() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
