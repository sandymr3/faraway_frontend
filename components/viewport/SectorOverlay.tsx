"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";
import { agentColor } from "@/lib/colors";

// A ground-plane shader that paints a live Voronoi partition: every floor pixel
// is tinted by its nearest agent, with glowing cell boundaries. Visualizes the
// swarm's decentralized task allocation (who is responsible for which sector).

const vert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform vec2 uPos[10];
  uniform vec3 uColor[10];
  uniform int uCount;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vWorld;

  void main() {
    if (uCount == 0) discard;
    vec2 p = vWorld.xz;
    float best = 1e9;
    float second = 1e9;
    int bi = 0;
    for (int i = 0; i < 10; i++) {
      if (i >= uCount) break;
      float d = distance(p, uPos[i]);
      if (d < best) { second = best; best = d; bi = i; }
      else if (d < second) { second = d; }
    }
    vec3 col = uColor[bi];
    // boundary glow where the two nearest agents are nearly equidistant
    float edge = 1.0 - smoothstep(0.0, 0.85, second - best);
    // faint concentric scan from each seed for a "sensing" feel
    float scan = 0.05 * sin(best * 1.1 - uTime * 2.0);
    float a = uOpacity + edge * 0.55 + scan;
    vec3 outc = mix(col, vec3(1.0), edge * 0.55);
    gl_FragColor = vec4(outc, clamp(a, 0.0, 0.85));
  }
`;

export default function SectorOverlay() {
  const mesh = useRef<THREE.Mesh>(null);
  const palette = useMemo(
    () => Array.from({ length: 10 }, (_, i) => new THREE.Color(agentColor(i))),
    []
  );

  const uniforms = useMemo(
    () => ({
      uPos: { value: Array.from({ length: 10 }, () => new THREE.Vector2()) },
      uColor: { value: Array.from({ length: 10 }, () => new THREE.Color("#39ff7a")) },
      uCount: { value: 0 },
      uOpacity: { value: 0.13 },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const st = useSwarm.getState();
    if (mesh.current) mesh.current.visible = st.showSectors;
    if (!st.showSectors) return;

    const roster = st.meta?.roster ?? [];
    const active = st.agents.filter((a) => a.status !== "down");
    const n = Math.min(10, active.length);
    for (let i = 0; i < n; i++) {
      const a = active[i];
      uniforms.uPos.value[i].set(a.pos_est[0], a.pos_est[1]);
      const idx = roster.findIndex((r) => r.id === a.id);
      uniforms.uColor.value[i].copy(palette[idx >= 0 ? idx % 10 : 0]);
    }
    uniforms.uCount.value = n;
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} frustumCulled={false}>
      <planeGeometry args={[40, 40]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
