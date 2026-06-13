"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";

const MAX_EDGES = 64;

export default function CommLinks() {
  const geom = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(MAX_EDGES * 2 * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_EDGES * 2 * 3), []);
  const cActive = new THREE.Color("#39ff7a");
  const cWeak = new THREE.Color("#0e6b3a");

  useFrame(() => {
    const st = useSwarm.getState();
    const posById = new Map<string, [number, number, number]>();
    for (const a of st.agents) if (a.status !== "down") posById.set(a.id, a.pos_est);

    let n = 0;
    for (const e of st.edges) {
      if (n >= MAX_EDGES) break;
      const pa = posById.get(e.a);
      const pb = posById.get(e.b);
      if (!pa || !pb) continue;
      const o = n * 6;
      positions[o] = pa[0]; positions[o + 1] = pa[2]; positions[o + 2] = pa[1];
      positions[o + 3] = pb[0]; positions[o + 4] = pb[2]; positions[o + 5] = pb[1];
      const c = cWeak.clone().lerp(cActive, e.weight);
      colors[o] = c.r; colors[o + 1] = c.g; colors[o + 2] = c.b;
      colors[o + 3] = c.r; colors[o + 4] = c.g; colors[o + 5] = c.b;
      n++;
    }
    if (geom.current) {
      geom.current.setDrawRange(0, n * 2);
      (geom.current.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geom.current.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geom}>
        <bufferAttribute attach="attributes-position" array={positions} count={MAX_EDGES * 2} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={MAX_EDGES * 2} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}
