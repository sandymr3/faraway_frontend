import { io, type Socket } from "socket.io-client";
import { useSwarm } from "./store";
import type { Telemetry, WorldMeta, Alert } from "./types";
import { startDemoFeed, stopDemoFeed } from "./demoFeed";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

let socket: Socket | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

export function connectSocket() {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 800,
  });

  // Dev aid: expose the socket so it can be paused for a clean screenshot.
  if (typeof window !== "undefined") (window as any).__socket = socket;

  const store = useSwarm.getState;

  socket.on("connect", () => {
    stopDemoFeed();
    if (fallbackTimer) clearTimeout(fallbackTimer);
    store().setConnected(true, "live");
  });

  socket.on("hello", (meta: WorldMeta) => {
    store().setMeta(meta);
    store().hardReset();
  });

  socket.on("map", (data: { points: [number, number, string][] }) => {
    store().loadCloud(data.points || []);
  });

  socket.on("telemetry", (t: Telemetry) => {
    store().applyTelemetry(t);
  });

  socket.on("alert", (a: Alert) => {
    store().pushAlert(a);
  });

  socket.on("disconnect", () => {
    store().setConnected(false, store().source);
  });

  // If the live backend never answers, fall back to a synthetic demo feed so
  // the dashboard always has something to show during a pitch.
  fallbackTimer = setTimeout(() => {
    if (!useSwarm.getState().connected) startDemoFeed();
  }, 3500);

  return socket;
}

export function simulateEMP(fraction = 0.4) {
  if (socket && useSwarm.getState().source === "live") {
    socket.emit("simulate_emp", { fraction });
  } else {
    startDemoFeed("emp", fraction);
  }
}

export function killNode(id: string) {
  if (socket && useSwarm.getState().source === "live") {
    socket.emit("kill_node", { id });
  } else {
    startDemoFeed("kill", 0, id);
  }
}

export function resetSwarm() {
  if (socket && useSwarm.getState().source === "live") {
    socket.emit("reset");
  } else {
    startDemoFeed("reset");
  }
}
