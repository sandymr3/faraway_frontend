// demoFeed.ts — Offline fallback: a lightweight synthetic swarm so the dashboard
// always demos, even with no backend. Mirrors the telemetry schema; not a real
// localiser — it fakes plausible motion, mesh, mapping, survivors and EMP.
import { useSwarm } from "./store";
import type { Agent, Edge, Survivor, Telemetry, WorldMeta } from "./types";

const BOUNDS = 15;
const COMM = 16;
const DT = 1 / 30;

const OBSTACLES = [
  { cx: -9, cy: 8, w: 10, h: 5 },
  { cx: 7, cy: 10, w: 9, h: 4 },
  { cx: -11, cy: -6, w: 6, h: 9 },
  { cx: 3, cy: -4, w: 7, h: 7 },
  { cx: 12, cy: -9, w: 6, h: 6 },
  { cx: -2, cy: 1, w: 3, h: 3 },
];

const ROSTER: { id: string; type: "uav" | "ugv" }[] = [
  { id: "UGV_Alpha", type: "ugv" }, { id: "UGV_Bravo", type: "ugv" },
  { id: "UGV_Charlie", type: "ugv" }, { id: "UGV_Delta", type: "ugv" },
  { id: "UAV_Beta_01", type: "uav" }, { id: "UAV_Beta_02", type: "uav" },
  { id: "UAV_Beta_03", type: "uav" }, { id: "UAV_Beta_04", type: "uav" },
  { id: "UAV_Beta_05", type: "uav" }, { id: "UAV_Beta_06", type: "uav" },
];

const SURVIVORS: [number, number][] = [
  [-9, 11.5], [10.5, 9], [-11, -1], [5.5, -7.5], [12, -5],
];

interface DAgent {
  id: string; type: "uav" | "ugv"; x: number; y: number; yaw: number;
  v: number; down: boolean; battery: number; sigma: number;
}

let timer: ReturnType<typeof setInterval> | null = null;
let agents: DAgent[] = [];
let t = 0;
let coverage = 0.06;
let found: Record<number, { conf: number; by: Set<string> }> = {};
let seen = new Set<string>();

function inObstacle(x: number, y: number) {
  if (Math.abs(x) >= BOUNDS || Math.abs(y) >= BOUNDS) return true;
  return OBSTACLES.some(
    (o) => Math.abs(x - o.cx) <= o.w / 2 && Math.abs(y - o.cy) <= o.h / 2
  );
}

function nearestWallPoint(x: number, y: number) {
  let best: [number, number] | null = null;
  let bd = 8;
  for (const o of OBSTACLES) {
    const px = Math.max(o.cx - o.w / 2, Math.min(x, o.cx + o.w / 2));
    const py = Math.max(o.cy - o.h / 2, Math.min(y, o.cy + o.h / 2));
    const d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = [px, py]; }
  }
  return best;
}

function init() {
  agents = ROSTER.map((r, i) => ({
    id: r.id, type: r.type,
    x: -10.5 + (Math.random() - 0.5) * 4,
    y: -12.5 + (Math.random() - 0.5) * 4,
    yaw: Math.random() * Math.PI * 2,
    v: 0, down: false, battery: 1, sigma: 0.06,
  }));
  t = 0; coverage = 0.06; found = {}; seen = new Set();
}

function components(alive: DAgent[], edges: Edge[]): string[][] {
  const parent: Record<string, string> = {};
  alive.forEach((a) => (parent[a.id] = a.id));
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  edges.forEach((e) => (parent[find(e.a)] = find(e.b)));
  const groups: Record<string, string[]> = {};
  alive.forEach((a) => {
    const r = find(a.id);
    (groups[r] ||= []).push(a.id);
  });
  return Object.values(groups).map((g) => g.sort());
}

function frame(): Telemetry {
  t += DT;
  const alive = agents.filter((a) => !a.down);

  // wander + obstacle/boundary avoidance + mild dispersion
  for (const a of agents) {
    if (a.down) { a.v = 0; continue; }
    a.yaw += (Math.random() - 0.5) * 0.25;
    let sep = [0, 0];
    for (const o of alive) {
      if (o === a) continue;
      const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy);
      if (d > 0.01 && d < 4) { sep[0] += dx / (d * d); sep[1] += dy / (d * d); }
    }
    if (Math.hypot(sep[0], sep[1]) > 0.01) a.yaw = Math.atan2(
      0.7 * Math.sin(a.yaw) + sep[1], 0.7 * Math.cos(a.yaw) + sep[0]
    );
    a.v = a.type === "uav" ? 2.0 : 1.3;
    const nx = a.x + Math.cos(a.yaw) * a.v * DT;
    const ny = a.y + Math.sin(a.yaw) * a.v * DT;
    if (inObstacle(nx, ny)) { a.yaw += 2.1; }
    else { a.x = nx; a.y = ny; }
    a.battery = Math.max(0, a.battery - 0.0008 * DT);
    a.sigma = Math.max(0.02, a.sigma * 0.98);
  }

  // edges + components
  const edges: Edge[] = [];
  for (let i = 0; i < alive.length; i++)
    for (let j = i + 1; j < alive.length; j++) {
      const d = Math.hypot(alive[i].x - alive[j].x, alive[i].y - alive[j].y);
      if (d <= COMM)
        edges.push({ a: alive[i].id, b: alive[j].id, weight: +Math.max(0.05, 1 - d / COMM).toFixed(3) });
    }
  const comps = components(alive, edges);
  const neigh: Record<string, string[]> = {};
  alive.forEach((a) => (neigh[a.id] = []));
  edges.forEach((e) => { neigh[e.a].push(e.b); neigh[e.b].push(e.a); });

  // map points (dedup)
  const delta: [number, number, string][] = [];
  for (const a of alive) {
    const wp = nearestWallPoint(a.x, a.y);
    if (wp) {
      const key = `${Math.round(wp[0] * 2)},${Math.round(wp[1] * 2)}`;
      if (!seen.has(key)) { seen.add(key); delta.push([+wp[0].toFixed(2), +wp[1].toFixed(2), a.id]); }
    }
  }
  coverage = Math.min(0.9, coverage + 0.0009 + alive.length * 0.00004);

  // survivors
  for (const a of alive)
    SURVIVORS.forEach((s, si) => {
      const d = Math.hypot(a.x - s[0], a.y - s[1]);
      if (d <= 6) {
        const rec = (found[si] ||= { conf: 0, by: new Set() });
        rec.conf = Math.min(1, rec.conf + 0.05 * (1 - d / 6));
        rec.by.add(a.id);
      }
    });
  const survivors: Survivor[] = Object.entries(found).map(([si, rec]) => ({
    id: `S${+si + 1}`,
    pos: [SURVIVORS[+si][0], SURVIVORS[+si][1], 0.4],
    confidence: +rec.conf.toFixed(2),
    found_by: [...rec.by].sort(),
  }));

  const outAgents: Agent[] = agents.map((a) => {
    const ne = a.down ? [] : neigh[a.id] || [];
    const status = a.down ? "down" : ne.length === 0 ? "isolated" : "active";
    const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
    const s2 = a.sigma;
    const cov: [[number, number], [number, number]] = [
      [c * c * s2 * 1.7 + s * s * s2 * 0.7, c * s * (s2 * 1.7 - s2 * 0.7)],
      [c * s * (s2 * 1.7 - s2 * 0.7), s * s * s2 * 1.7 + c * c * s2 * 0.7],
    ];
    return {
      id: a.id, type: a.type,
      pos_est: [+a.x.toFixed(2), +a.y.toFixed(2), a.type === "uav" ? 3.2 : 0.35],
      yaw: +a.yaw.toFixed(3), vel: [+a.v.toFixed(2), 0],
      status, battery: +a.battery.toFixed(3), cov,
      loc_error_cm: a.down ? 0 : +(3 + Math.random() * 6).toFixed(1),
      neighbors: ne.sort(),
    };
  });

  const largest = Math.max(0, ...comps.map((c) => c.length));
  return {
    t: +t.toFixed(2), tick: Math.round(t * 30),
    agents: outAgents, edges, components: comps, survivors,
    pointcloud_delta: delta,
    metrics: {
      mean_loc_error_cm: +(4 + Math.random() * 4).toFixed(1),
      connectivity: alive.length ? +(largest / alive.length).toFixed(2) : 0,
      coverage_pct: +coverage.toFixed(3),
      agents_active: alive.length,
      agents_down: agents.length - alive.length,
      survivors_found: survivors.filter((s) => s.confidence > 0.3).length,
    },
    alerts: [],
  };
}

function meta(): WorldMeta {
  return { bounds: BOUNDS, comm_range: COMM, obstacles: OBSTACLES, roster: ROSTER, tick_hz: 30 };
}

export function startDemoFeed(
  cmd?: "emp" | "kill" | "reset",
  fraction = 0.4,
  id?: string
) {
  const store = useSwarm.getState();

  if (!timer) {
    init();
    store.setMeta(meta());
    store.hardReset();
    store.setConnected(true, "demo");
    timer = setInterval(() => useSwarm.getState().applyTelemetry(frame()), 1000 / 30);
  }

  if (cmd === "emp") {
    const aliveIds = agents.filter((a) => !a.down).map((a) => a.id);
    const k = Math.max(1, Math.round(agents.length * fraction));
    const hit: string[] = [];
    for (let i = 0; i < k && aliveIds.length; i++) {
      const idx = Math.floor(Math.random() * aliveIds.length);
      hit.push(aliveIds.splice(idx, 1)[0]);
    }
    agents.forEach((a) => { if (hit.includes(a.id)) a.down = true; });
    const pct = Math.round((100 * agents.filter((a) => a.down).length) / agents.length);
    store.pushAlert({
      level: "critical",
      msg: `CRITICAL: Link Failure on ${pct}% of Nodes. Re-routing GNN Topology...`,
      nodes: hit,
    });
  } else if (cmd === "kill" && id) {
    agents.forEach((a) => { if (a.id === id) a.down = true; });
    store.pushAlert({ level: "warning", msg: `Node ${id} link severed.`, nodes: [id] });
  } else if (cmd === "reset") {
    init();
    store.hardReset();
    store.pushAlert({ level: "info", msg: "Swarm redeployed. All nodes nominal.", nodes: [] });
  }
}

export function stopDemoFeed() {
  if (timer) { clearInterval(timer); timer = null; }
}
