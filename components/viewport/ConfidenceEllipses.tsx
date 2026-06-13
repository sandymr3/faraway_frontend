"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";
import { covEllipse } from "./util";

const SEG = 48;

export default function ConfidenceEllipses() {
  const meta = useSwarm((s) => s.meta);
  const roster = meta?.roster ?? [];
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  const circle = useMemo(() => {
    const arr = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      arr[i * 3] = Math.cos(a);
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(a);
    }
    return arr;
  }, []);

  const green = new THREE.Color("#39ff7a");
  const amber = new THREE.Color("#ffb000");

  useFrame(() => {
    const agents = useSwarm.getState().agents;
    roster.forEach((r, i) => {
      const g = groups.current[i];
      if (!g) return;
      const a = agents.find((x) => x.id === r.id);
      if (!a || a.status === "down") {
        g.visible = false;
        return;
      }
      g.visible = true;
      const { rx, ry, angle } = covEllipse(a.cov);
      g.position.set(a.pos_est[0], 0.03, a.pos_est[1]);
      g.rotation.y = -angle;
      g.scale.set(Math.max(0.15, rx), 1, Math.max(0.15, ry));
      const m = mats.current[i];
      if (m) {
        const unc = Math.min(1, (rx + ry) / 4);
        m.color.copy(green).lerp(amber, unc);
        m.opacity = 0.25 + unc * 0.4;
      }
    });
  });

  return (
    <>
      {roster.map((r, i) => (
        <group key={r.id} ref={(el) => (groups.current[i] = el)}>
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" array={circle} count={SEG + 1} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial
              ref={(el) => (mats.current[i] = el)}
              color="#39ff7a"
              transparent
              opacity={0.4}
              depthWrite={false}
            />
          </lineLoop>
        </group>
      ))}
    </>
  );
}
