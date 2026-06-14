import { create } from "zustand";
import { play as playCue } from "./audio";
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
const MAX_HISTORY = 1100; // ~36s of replay buffer at 30Hz

export type Source = "live" | "demo" | null;

// A lightweight snapshot of one telemetry frame for the replay buffer.
export interface Frame {
  t: number;
  tick: number;
  agents: Agent[];
  edges: Edge[];
  components: string[][];
  survivors: Survivor[];
  metrics: Metrics;
  cloudLen: number; // map points discovered as of this frame
}

interface SwarmState {
  connected: boolean;
  source: Source;
  booted: boolean;
  meta: WorldMeta | null;

  // Currently displayed frame (live tail, or a scrubbed replay frame).
  agents: Agent[];
  edges: Edge[];
  components: string[][];
  survivors: Survivor[];
  metrics: Metrics | null;

  cloud: number[];
  cloudColorIdx: number[];
  cloudDrawCount: number; // how many map points to render (rewinds on replay)

  banner: Alert | null;
  bannerKey: number;
  log: { ts: number; alert: Alert }[];

  // Replay
  history: Frame[];
  replay: { active: boolean; index: number };

  // Inspection
  selectedId: string | null;
  select: (id: string | null) => void;

  // Layers
  showSectors: boolean;
  toggleSectors: () => void;

  setConnected: (v: boolean, source: Source) => void;
  setMeta: (m: WorldMeta) => void;
  loadCloud: (points: [number, number, string][]) => void;
  applyTelemetry: (t: Telemetry) => void;
  pushAlert: (a: Alert) => void;
  clearBanner: () => void;
  hardReset: () => void;

  enterReplay: () => void;
  exitReplay: () => void;
  setReplayIndex: (i: number) => void;
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
  cloudDrawCount: 0,

  banner: null,
  bannerKey: 0,
  log: [],

  history: [],
  replay: { active: false, index: 0 },

  selectedId: null,
  select: (id) => set({ selectedId: id }),

  showSectors: true,
  toggleSectors: () => set((s) => ({ showSectors: !s.showSectors })),

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
    set({ cloud, cloudColorIdx: colors, cloudDrawCount: colors.length });
  },

  applyTelemetry: (t) => {
    const s = get();
    const rosterIndex = (id: string) =>
      s.meta ? Math.max(0, s.meta.roster.findIndex((r) => r.id === id)) : 0;

    // Grow the collaborative map cloud (capped, FIFO).
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
    const cloudLen = colors.length;

    // Always record the frame into the replay ring buffer.
    const frame: Frame = {
      t: t.t,
      tick: t.tick,
      agents: t.agents,
      edges: t.edges,
      components: t.components,
      survivors: t.survivors,
      metrics: t.metrics,
      cloudLen,
    };
    const history = s.history.length >= MAX_HISTORY
      ? (s.history.slice(s.history.length - MAX_HISTORY + 1).concat(frame))
      : s.history.concat(frame);

    // Audio: ping when a new survivor crosses the detection threshold.
    if (s.metrics && t.metrics.survivors_found > s.metrics.survivors_found) {
      playCue("survivor");
    }

    if (s.replay.active) {
      // Keep buffering live data, but leave the scrubbed view frozen.
      set({ cloud, cloudColorIdx: colors, history, booted: true });
    } else {
      set({
        agents: t.agents,
        edges: t.edges,
        components: t.components,
        survivors: t.survivors,
        metrics: t.metrics,
        cloud,
        cloudColorIdx: colors,
        cloudDrawCount: cloudLen,
        history,
        booted: true,
      });
    }

    for (const a of t.alerts) get().pushAlert(a);
  },

  pushAlert: (a) => {
    if (a.level === "critical") playCue("emp");
    set((s) => ({
      banner: a,
      bannerKey: s.bannerKey + 1,
      log: [{ ts: Date.now(), alert: a }, ...s.log].slice(0, 40),
    }));
  },

  clearBanner: () => set({ banner: null }),

  hardReset: () =>
    set({
      agents: [],
      edges: [],
      components: [],
      survivors: [],
      cloud: [],
      cloudColorIdx: [],
      cloudDrawCount: 0,
      booted: false,
      history: [],
      replay: { active: false, index: 0 },
      selectedId: null,
    }),

  // ---- Replay controls ------------------------------------------------ //
  enterReplay: () => {
    const s = get();
    if (s.history.length === 0) return;
    const i = s.history.length - 1;
    get().setReplayIndex(i);
    set({ replay: { active: true, index: i } });
  },

  exitReplay: () => {
    const s = get();
    const last = s.history[s.history.length - 1];
    set({
      replay: { active: false, index: s.history.length - 1 },
      ...(last
        ? {
            agents: last.agents,
            edges: last.edges,
            components: last.components,
            survivors: last.survivors,
            metrics: last.metrics,
            cloudDrawCount: s.cloudColorIdx.length,
          }
        : {}),
    });
  },

  setReplayIndex: (i) => {
    const s = get();
    const idx = Math.max(0, Math.min(s.history.length - 1, i));
    const f = s.history[idx];
    if (!f) return;
    set({
      replay: { active: true, index: idx },
      agents: f.agents,
      edges: f.edges,
      components: f.components,
      survivors: f.survivors,
      metrics: f.metrics,
      cloudDrawCount: f.cloudLen,
    });
  },
}));

// Dev aid: expose the store for live inspection in the browser console.
if (typeof window !== "undefined") (window as any).__swarm = useSwarm;
