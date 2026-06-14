"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STATS = [
  { v: "10", l: "HETEROGENEOUS AGENTS" },
  { v: "30 Hz", l: "LIVE TELEMETRY" },
  { v: "0", l: "GPS / ANCHORS" },
  { v: "40%", l: "NODE-LOSS SURVIVAL" },
];

export default function LandingScreen({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* top navigation */}
      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 54,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 22px",
          borderBottom: "1px solid var(--hair)",
          zIndex: 5,
          background: "linear-gradient(90deg, rgba(57,255,122,0.05), transparent 45%)",
        }}
      >
        <span className="display glow" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.14em" }}>
          SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
        </span>
        <span className="mono" style={{ color: "var(--text-dim)", fontSize: 9, letterSpacing: "0.2em" }}>
          OPERATOR CONSOLE
        </span>
        <span style={{ flex: 1 }} />
        <NavLink href="/about">ABOUT / BRIEF</NavLink>
        <NavExt href="https://github.com/sandymr3/faraway_frontend">SOURCE ↗</NavExt>
      </nav>

      {/* hero */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <div
            className="display glow"
            style={{ fontSize: 12, letterSpacing: "0.5em", color: "var(--green-dim)" }}
          >
            DECENTRALIZED · GPS-DENIED · INFRASTRUCTURE-FREE
          </div>
          <div
            className="display glow"
            style={{ fontSize: "clamp(48px, 9vw, 104px)", fontWeight: 700, letterSpacing: "0.14em", lineHeight: 1 }}
          >
            SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
          </div>
          <div
            className="mono"
            style={{ marginTop: 14, color: "var(--text)", fontSize: 14, letterSpacing: "0.06em", maxWidth: 640 }}
          >
            Swarm-intelligence command console for disaster response. A heterogeneous
            fleet of drones and rovers localizes, maps, and self-heals its mesh —
            with no GPS, no base station, and no central controller.
          </div>
        </motion.div>

        {/* launch */}
        <motion.button
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLaunch}
          className="btn"
          style={{
            marginTop: 6,
            fontSize: 17,
            padding: "16px 38px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            letterSpacing: "0.2em",
            boxShadow: "0 0 22px rgba(57,255,122,0.25)",
          }}
        >
          <span style={{ fontSize: 18 }}>▶</span> LAUNCH SWARMRESQ
        </motion.button>
        <div className="mono" style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: "0.12em" }}>
          BOOTS THE CONSOLE · CONNECTS TO LIVE SWARM TELEMETRY · FALLS BACK TO SIM IF OFFLINE
        </div>

        {/* stat chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}
        >
          {STATS.map((s) => (
            <div
              key={s.l}
              className="panel"
              style={{ padding: "12px 18px", minWidth: 130, textAlign: "center", background: "rgba(5,12,10,0.6)" }}
            >
              <div className="display glow" style={{ fontSize: 26, color: "var(--green)" }}>{s.v}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.14em", marginTop: 3 }}>
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div
        className="mono"
        style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.18em" }}
      >
        ANCHOR-FREE MDS LOCALIZATION · DYNAMIC GNN TOPOLOGY · FAULT-TOLERANT BY DESIGN
      </div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mono"
      style={{
        fontSize: 11,
        letterSpacing: "0.16em",
        color: "var(--green)",
        textDecoration: "none",
        border: "1px solid var(--green-dim)",
        padding: "7px 13px",
        transition: "all 0.15s",
      }}
    >
      {children}
    </Link>
  );
}

function NavExt({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mono"
      style={{ fontSize: 11, letterSpacing: "0.16em", color: "var(--text-dim)", textDecoration: "none", padding: "7px 6px" }}
    >
      {children}
    </a>
  );
}
