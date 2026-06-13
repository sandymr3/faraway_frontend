"use client";

import { useEffect, useRef } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
} from "d3-force";
import { useSwarm } from "@/lib/store";
import { killNode } from "@/lib/socket";

interface Node {
  id: string;
  type: "uav" | "ugv";
  status: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export default function TopologyGraph() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nodesMap = useRef<Map<string, Node>>(new Map());
  const sim = useRef<Simulation<Node, any> | null>(null);
  const sigRef = useRef("");

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const ro = new ResizeObserver(() => {
      const r = wrap.current!.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim.current?.force("center", forceCenter(w / 2, h / 2));
      sim.current?.alpha(0.5).restart();
    });
    ro.observe(wrap.current!);

    const s = forceSimulation<Node>([])
      .force("charge", forceManyBody().strength(-260))
      .force("collide", forceCollide(20))
      .force("link", forceLink<Node, any>([]).id((d: any) => d.id).distance((l: any) => 46 + (1 - l.weight) * 70).strength((l: any) => 0.25 + l.weight * 0.5))
      .alphaTarget(0.04)
      .velocityDecay(0.45)
      .stop();
    sim.current = s;

    let raf = 0;
    const tick = () => {
      const st = useSwarm.getState();
      const map = nodesMap.current;

      // Reconcile nodes with current agents.
      const ids = new Set(st.agents.map((a) => a.id));
      for (const id of [...map.keys()]) if (!ids.has(id)) map.delete(id);
      for (const a of st.agents) {
        let n = map.get(a.id);
        if (!n) {
          n = { id: a.id, type: a.type, status: a.status, x: w / 2 + (Math.random() - 0.5) * 60, y: h / 2 + (Math.random() - 0.5) * 60 };
          map.set(a.id, n);
        }
        n.status = a.status;
        if (a.status === "down") { n.fx = n.x; n.fy = n.y; }
        else { n.fx = null; n.fy = null; }
      }
      const nodes = [...map.values()];
      const links = st.edges
        .filter((e) => map.has(e.a) && map.has(e.b))
        .map((e) => ({ source: map.get(e.a)!, target: map.get(e.b)!, weight: e.weight }));

      // Reheat when the topology changes (e.g. EMP).
      const sig = `${nodes.length}|${st.edges.length}|${st.metrics?.agents_down ?? 0}`;
      if (sig !== sigRef.current) { sigRef.current = sig; s.alpha(0.7); }

      s.nodes(nodes);
      (s.force("link") as any).links(links);
      s.tick();

      // ---- draw ----
      ctx.clearRect(0, 0, w, h);

      // links
      for (const l of links) {
        const a = l.source, b = l.target;
        const g = Math.round(120 + l.weight * 135);
        ctx.strokeStyle = `rgba(57, ${g}, 122, ${0.25 + l.weight * 0.6})`;
        ctx.lineWidth = 0.6 + l.weight * 2.2;
        ctx.beginPath();
        ctx.moveTo(a.x!, a.y!);
        ctx.lineTo(b.x!, b.y!);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        const col = n.status === "down" ? "#ff3b30" : n.status === "isolated" ? "#ffb000" : "#39ff7a";
        const r = n.type === "uav" ? 8 : 9;
        ctx.shadowColor = col;
        ctx.shadowBlur = n.status === "down" ? 4 : 14;
        ctx.fillStyle = n.status === "down" ? "rgba(40,8,8,0.9)" : "rgba(6,20,13,0.9)";
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (n.type === "uav") {
          // diamond for UAV
          ctx.moveTo(n.x!, n.y! - r); ctx.lineTo(n.x! + r, n.y!); ctx.lineTo(n.x!, n.y! + r); ctx.lineTo(n.x! - r, n.y!); ctx.closePath();
        } else {
          ctx.rect(n.x! - r, n.y! - r, r * 2, r * 2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (n.status === "down") {
          ctx.strokeStyle = "#ff3b30";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(n.x! - 4, n.y! - 4); ctx.lineTo(n.x! + 4, n.y! + 4);
          ctx.moveTo(n.x! + 4, n.y! - 4); ctx.lineTo(n.x! - 4, n.y! + 4);
          ctx.stroke();
        }

        ctx.fillStyle = n.status === "down" ? "#7a3a37" : "#5f8a72";
        ctx.font = "9px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.id.replace("UAV_", "").replace("UGV_", ""), n.x!, n.y! + r + 11);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // click to sever a node
    const onClick = (ev: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      const mx = ev.clientX - r.left;
      const my = ev.clientY - r.top;
      for (const n of nodesMap.current.values()) {
        if (n.status === "down") continue;
        if (Math.hypot((n.x ?? 0) - mx, (n.y ?? 0) - my) < 14) {
          killNode(n.id);
          break;
        }
      }
    };
    cv.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("click", onClick);
      s.stop();
    };
  }, []);

  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvas} style={{ display: "block", cursor: "pointer" }} />
      <div
        className="mono"
        style={{ position: "absolute", bottom: 6, left: 8, fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", pointerEvents: "none" }}
      >
        ◇ UAV · ▢ UGV · CLICK NODE TO SEVER
      </div>
    </div>
  );
}
