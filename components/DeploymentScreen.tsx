"use client";

import { motion } from "framer-motion";
import { useSwarm } from "@/lib/store";

export default function DeploymentScreen() {
  const connected = useSwarm((s) => s.connected);
  const source = useSwarm((s) => s.source);
  const meta = useSwarm((s) => s.meta);
  const roster = meta?.roster ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.5 }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      {/* Brand */}
      <div style={{ textAlign: "center" }}>
        <div className="display glow" style={{ fontSize: 13, letterSpacing: "0.5em", color: "var(--green-dim)" }}>
          DECENTRALIZED · GPS-DENIED · INFRASTRUCTURE-FREE
        </div>
        <div className="display glow" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "0.18em", marginTop: 6 }}>
          SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
        </div>
      </div>

      {/* Radar */}
      <div style={{ position: "relative", width: 300, height: 300 }}>
        <Radar active={connected} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {!connected ? (
            <div className="mono blink" style={{ color: "var(--amber)", fontSize: 13, letterSpacing: "0.15em" }}>
              AWAITING SWARM CONNECTION
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="display glow"
              style={{ color: "var(--green)", fontSize: 16, letterSpacing: "0.2em" }}
            >
              LINK ESTABLISHED
            </motion.div>
          )}
        </div>
      </div>

      {/* Node connection cascade */}
      <div style={{ minHeight: 150, width: 520 }}>
        {connected && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 22px" }}>
            {roster.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.13 }}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
              >
                <span className="dot dot-active" />
                <span className="mono" style={{ color: "var(--text)" }}>{r.id}</span>
                <span style={{ flex: 1 }} />
                <span className="mono glow" style={{ color: "var(--green)", fontSize: 10, letterSpacing: "0.15em" }}>
                  CONNECTED
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mono" style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: "0.1em" }}>
        {connected
          ? `MESH SYNC · ${source === "demo" ? "SIMULATED FEED" : "LIVE ROS BRIDGE"} · INITIALIZING EKF`
          : "LISTENING ON :8000 · UWB MESH DISCOVERY"}
      </div>
    </motion.div>
  );
}

function Radar({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 300 300" width={300} height={300}>
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(57,255,122,0.10)" />
          <stop offset="100%" stopColor="rgba(57,255,122,0)" />
        </radialGradient>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(57,255,122,0)" />
          <stop offset="100%" stopColor="rgba(57,255,122,0.55)" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r="148" fill="url(#rg)" stroke="var(--hair)" />
      {[110, 72, 36].map((r) => (
        <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="var(--hair)" />
      ))}
      <line x1="2" y1="150" x2="298" y2="150" stroke="var(--hair)" />
      <line x1="150" y1="2" x2="150" y2="298" stroke="var(--hair)" />
      <g style={{ transformOrigin: "150px 150px", animation: "spin 2.6s linear infinite" }}>
        <path d="M150 150 L150 4 A146 146 0 0 1 280 110 Z" fill="url(#sweep)" opacity={active ? 0.9 : 0.5} />
        <line x1="150" y1="150" x2="150" y2="4" stroke="var(--green)" strokeWidth="1.5" />
      </g>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
