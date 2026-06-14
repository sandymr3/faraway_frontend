"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useSwarm } from "@/lib/store";
import Header from "@/components/hud/Header";
import MetricsHUD from "@/components/hud/MetricsHUD";
import NodeRoster from "@/components/hud/NodeRoster";
import EventLog from "@/components/hud/EventLog";
import AlertBanner from "@/components/hud/AlertBanner";
import ControlDeck from "@/components/hud/ControlDeck";
import ReplayBar from "@/components/hud/ReplayBar";
import AgentDetailPanel from "@/components/hud/AgentDetailPanel";
import LayerToggles from "@/components/hud/LayerToggles";
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

      {/* Every panel below is drag-resizable; layout persists via autoSaveId. */}
      <div style={{ flex: 1, minHeight: 0, padding: 12 }}>
        <PanelGroup direction="horizontal" autoSaveId="swarmresq:cols">
          {/* LEFT — 3D mission viewport */}
          <Panel defaultSize={68} minSize={42}>
            <section className="panel reveal" style={{ position: "relative", overflow: "hidden", height: "100%" }}>
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
              <LayerToggles />
              <AgentDetailPanel />
              <ControlDeck />
              <ReplayBar />
            </section>
          </Panel>

          <PanelResizeHandle className="rs-handle rs-handle-v" />

          {/* RIGHT — telemetry + topology, each row independently resizable */}
          <Panel defaultSize={32} minSize={22}>
            <PanelGroup direction="vertical" autoSaveId="swarmresq:rows">
              <Panel defaultSize={36} minSize={14}>
                <div className="panel reveal" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div className="panel-title">
                    <span>◢ GNN TOPOLOGY</span>
                    <ConnPill />
                  </div>
                  <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                    <TopologyGraph />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="rs-handle rs-handle-h" />

              <Panel defaultSize={30} minSize={14}>
                <MetricsHUD />
              </Panel>

              <PanelResizeHandle className="rs-handle rs-handle-h" />

              <Panel defaultSize={20} minSize={10}>
                <NodeRoster />
              </Panel>

              <PanelResizeHandle className="rs-handle rs-handle-h" />

              <Panel defaultSize={14} minSize={8}>
                <EventLog />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
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
