export type AgentStatus = "active" | "isolated" | "down";

export interface Agent {
  id: string;
  type: "uav" | "ugv";
  pos_est: [number, number, number]; // x, y, altitude (relative frame)
  yaw: number;
  vel: [number, number];
  status: AgentStatus;
  battery: number;
  cov: [[number, number], [number, number]];
  loc_error_cm: number;
  neighbors: string[];
}

export interface Edge {
  a: string;
  b: string;
  weight: number;
}

export interface Survivor {
  id: string;
  pos: [number, number, number];
  confidence: number;
  found_by: string[];
}

export interface Metrics {
  mean_loc_error_cm: number;
  connectivity: number;
  coverage_pct: number;
  agents_active: number;
  agents_down: number;
  survivors_found: number;
}

export interface Alert {
  level: "info" | "warning" | "critical";
  msg: string;
  nodes?: string[];
}

export interface Telemetry {
  t: number;
  tick: number;
  agents: Agent[];
  edges: Edge[];
  components: string[][];
  survivors: Survivor[];
  pointcloud_delta: [number, number, string][];
  metrics: Metrics;
  alerts: Alert[];
}

export interface Obstacle {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface WorldMeta {
  bounds: number;
  comm_range: number;
  obstacles: Obstacle[];
  roster: { id: string; type: "uav" | "ugv" }[];
  tick_hz: number;
}

export type PointCloudPoint = { x: number; y: number; agent: string };
