import { create } from "zustand";
import type {
  Agent,
  Alert,
  Edge,
  Metrics,
  Survivor,
  Telemetry,
  WorldMeta,
} from "./types";

const MAX_POINTS = 7000; // bound the collaborative map cloud

export type Source = "live" | "demo" | null;

interface SwarmState {
  connected: boolean;
  source: Source;
  booted: boolean; // first telemetry frame received → leave deployment screen
  meta: WorldMeta | null;

  agents: Agent[];
  edges: Edge[];
  components: string[][];
  survivors: Survivor[];
  metrics: Metrics | null;

  // Flat point cloud: [x, y, agentIndex] triples for the discovered map.
  cloud: number[];
  cloudColorIdx: number[];

  banner: Alert | null;
  bannerKey: number;
  log: { ts: number; alert: Alert }[];

  setConnected: (v: boolean, source: Source) => void;
  setMeta: (m: WorldMeta) => void;
  loadCloud: (points: [number, number, string][]) => void;
  applyTelemetry: (t: Telemetry) => void;
  pushAlert: (a: Alert) => void;
  clearBanner: () => void;
  hardReset: () => void;
}

export const useSwarm = create<SwarmState>((set, get) => ({
  connected: false,
  source: null,
  booted: false,
  meta: null,

  agents: [],
  edges: [],
  components: [],
  survivors: [],
  metrics: null,

  cloud: [],
  cloudColorIdx: [],

  banner: null,
  bannerKey: 0,
  log: [],

  setConnected: (v, source) => set({ connected: v, source }),
  setMeta: (m) => set({ meta: m }),

  // Bulk-load a full map snapshot (sent by the backend on connect/reset).
  loadCloud: (points) => {
    const s = get();
    const rosterIndex = (id: string) =>
      s.meta ? Math.max(0, s.meta.roster.findIndex((r) => r.id === id)) : 0;
    const slice = points.slice(-MAX_POINTS);
    const cloud: number[] = [];
    const colors: number[] = [];
    for (const [x, y, id] of slice) {
      cloud.push(x, y, 0);
      colors.push(rosterIndex(id));
    }
    set({ cloud, cloudColorIdx: colors });
  },

  applyTelemetry: (t) => {
    const s = get();
    const rosterIndex = (id: string) =>
      s.meta ? s.meta.roster.findIndex((r) => r.id === id) : 0;

    // Append new discovered map points (capped, FIFO).
    let cloud = s.cloud;
    let colors = s.cloudColorIdx;
    if (t.pointcloud_delta.length) {
      cloud = cloud.slice();
      colors = colors.slice();
      for (const [x, y, id] of t.pointcloud_delta) {
        cloud.push(x, y, 0);
        colors.push(rosterIndex(id));
      }
      const overflow = cloud.length / 3 - MAX_POINTS;
      if (overflow > 0) {
        cloud = cloud.slice(overflow * 3);
        colors = colors.slice(overflow);
      }
    }

    const patch: Partial<SwarmState> = {
      agents: t.agents,
      edges: t.edges,
      components: t.components,
      survivors: t.survivors,
      metrics: t.metrics,
      cloud,
      cloudColorIdx: colors,
      booted: true,
    };
    set(patch);

    for (const a of t.alerts) get().pushAlert(a);
  },

  pushAlert: (a) =>
    set((s) => ({
      banner: a,
      bannerKey: s.bannerKey + 1,
      log: [{ ts: Date.now(), alert: a }, ...s.log].slice(0, 40),
    })),

  clearBanner: () => set({ banner: null }),

  hardReset: () =>
    set({
      agents: [],
      edges: [],
      components: [],
      survivors: [],
      cloud: [],
      cloudColorIdx: [],
      booted: false,
    }),
}));

// Dev aid: expose the store for live inspection in the browser console.
if (typeof window !== "undefined") (window as any).__swarm = useSwarm;
