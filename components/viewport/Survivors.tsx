"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";
import type { Survivor } from "@/lib/types";

export default function Survivors() {
  const survivors = useSwarm((s) => s.survivors).filter((s) => s.confidence > 0.05);
  return (
    <>
      {survivors.map((s) => (
        <SurvivorBloom key={s.id} s={s} />
      ))}
    </>
  );
}

function SurvivorBloom({ s }: { s: Survivor }) {
  const core = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const conf = s.confidence;
  // pos = [backend_x, backend_y, height] → Three.js ground plane (x, 0.05, z)
  const sx = s.pos[0];
  const sy = s.pos[1];
  const color = new THREE.Color("#ffb000").lerp(new THREE.Color("#ff4a2a"), conf);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    if (core.current) core.current.scale.setScalar((0.3 + conf * 0.4) * pulse);
    if (light.current) light.current.intensity = (1.5 + conf * 5) * pulse;
    const grow = (t * 0.6) % 1;
    if (ring1.current) {
      ring1.current.scale.setScalar(0.4 + grow * (1.5 + conf * 2));
      (ring1.current.material as THREE.MeshBasicMaterial).opacity = (1 - grow) * 0.7 * conf;
    }
    const grow2 = (t * 0.6 + 0.5) % 1;
    if (ring2.current) {
      ring2.current.scale.setScalar(0.4 + grow2 * (1.5 + conf * 2));
      (ring2.current.material as THREE.MeshBasicMaterial).opacity = (1 - grow2) * 0.7 * conf;
    }
  });

  return (
    <group position={[sx, 0.05, sy]}>
      <pointLight ref={light} color={color} distance={6} intensity={3} />
      {/* hot core */}
      <mesh ref={core} position={[0, 0.4, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.85} />
      </mesh>
      {/* expanding thermal rings on the ground */}
      {[ring1, ring2].map((r, i) => (
        <mesh key={i} ref={r} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.0, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      {/* vertical signal beam */}
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 4.8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Billboard position={[0, 3.4, 0]}>
        <Text fontSize={0.55} color={conf >= 1 ? "#ff5a2a" : "#ffb000"} anchorX="center" outlineWidth={0.03} outlineColor="#130603">
          {`◈ SURVIVOR ${s.id} · ${Math.round(conf * 100)}%`}
        </Text>
      </Billboard>
    </group>
  );
}
