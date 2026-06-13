"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSwarm } from "@/lib/store";
import Header from "@/components/hud/Header";
import MetricsHUD from "@/components/hud/MetricsHUD";
import NodeRoster from "@/components/hud/NodeRoster";
import EventLog from "@/components/hud/EventLog";
import AlertBanner from "@/components/hud/AlertBanner";
import ControlDeck from "@/components/hud/ControlDeck";
import ReplayBar from "@/components/hud/ReplayBar";
import TopologyGraph from "@/components/topology/TopologyGraph";

// R3F canvas is browser-only.
const SwarmCanvas = dynamic(() => import("@/components/viewport/SwarmCanvas"), {
  ssr: false,
  loading: () => (
    <div className="mono" style={{ padding: 20, color: "var(--text-dim)" }}>
      INITIALIZING 3D MESH VIEWPORT…
    </div>
  ),
});

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Header />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 384px",
          gap: 12,
          padding: 12,
          minHeight: 0,
        }}
      >
        {/* LEFT — 3D mission viewport */}
        <section className="panel reveal" style={{ position: "relative", overflow: "hidden" }}>
          <div className="panel-title">
            <span>◢ LIVE OPERATIONS · 3D MESH MIRROR</span>
            <span className="mono" style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              ANCHOR-FREE RELATIVE FRAME
            </span>
          </div>
          <div style={{ position: "absolute", inset: "34px 0 46px 0" }}>
            <SwarmCanvas />
          </div>
          <AlertBanner />
          <ControlDeck />
          <ReplayBar />
        </section>

        {/* RIGHT — telemetry + topology */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <div className="panel reveal" style={{ height: 320, display: "flex", flexDirection: "column" }}>
            <div className="panel-title">
              <span>◢ GNN TOPOLOGY</span>
              <ConnPill />
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <TopologyGraph />
            </div>
          </div>

          <MetricsHUD />
          <NodeRoster />
          <EventLog />
        </aside>
      </div>
    </motion.div>
  );
}

function ConnPill() {
  const conn = useSwarm((s) => s.metrics?.connectivity ?? 0);
  const color = conn > 0.99 ? "var(--green)" : conn > 0.5 ? "var(--amber)" : "var(--red)";
  return (
    <span className="mono" style={{ color, fontSize: 10, letterSpacing: "0.12em" }}>
      MESH {Math.round(conn * 100)}%
    </span>
  );
}
