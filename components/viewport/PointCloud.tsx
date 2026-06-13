"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";
import { agentColor } from "@/lib/colors";

const CAP = 7000;

export default function PointCloud() {
  const geom = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(CAP * 3), []);
  const colors = useMemo(() => new Float32Array(CAP * 3), []);
  const uploaded = useRef(0);
  const palette = useMemo(
    () => Array.from({ length: 10 }, (_, i) => new THREE.Color(agentColor(i))),
    []
  );

  useFrame(() => {
    const st = useSwarm.getState();
    const cloud = st.cloud;
    const cidx = st.cloudColorIdx;
    const total = Math.min(CAP, cloud.length / 3);

    // Reset / FIFO-trim → rebuild from scratch.
    if (total < uploaded.current) uploaded.current = 0;

    if (total > uploaded.current) {
      for (let i = uploaded.current; i < total; i++) {
        positions[i * 3] = cloud[i * 3];        // x
        positions[i * 3 + 1] = 0.06;            // slightly above ground
        positions[i * 3 + 2] = cloud[i * 3 + 1]; // y -> three z
        const col = palette[((cidx[i] % 10) + 10) % 10] || palette[0];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
      uploaded.current = total;
      if (geom.current) {
        (geom.current.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (geom.current.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    // Draw count follows cloudDrawCount so the map rewinds during replay.
    const drawN = Math.min(uploaded.current, Math.max(0, Math.floor(st.cloudDrawCount)));
    if (geom.current) geom.current.setDrawRange(0, drawN);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geom}>
        <bufferAttribute attach="attributes-position" array={positions} count={CAP} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={CAP} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
