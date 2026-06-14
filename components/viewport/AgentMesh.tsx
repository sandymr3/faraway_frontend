"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSwarm } from "@/lib/store";
import { damp } from "./util";

const STATUS_COLOR: Record<string, string> = {
  active: "#39ff7a",
  isolated: "#ffb000",
  down: "#ff3b30",
};

export default function AgentMesh({ id, type }: { id: string; type: "uav" | "ugv" }) {
  const group = useRef<THREE.Group>(null);
  const rotors = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const label = useRef<any>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const a = useSwarm.getState().agents.find((x) => x.id === id);
    if (!a || !group.current) return;
    const [x, , y] = a.pos_est;
    const alt = a.pos_est[2];
    const g = group.current;
    g.position.x = damp(g.position.x, x, 6, dt);
    g.position.z = damp(g.position.z, y, 6, dt);
    g.position.y = damp(g.position.y, alt, 6, dt);
    g.rotation.y = -a.yaw;

    const col = STATUS_COLOR[a.status] ?? "#39ff7a";
    if (body.current) {
      body.current.color.set(col);
      body.current.emissive.set(col);
      body.current.emissiveIntensity = a.status === "down" ? 0.25 : 1.1;
    }
    if (light.current) light.current.color.set(col);
    if (rotors.current && a.status !== "down") rotors.current.rotation.y += dt * 30;
    if (label.current) label.current.color = col;

    // Selection targeting ring.
    const selected = useSwarm.getState().selectedId === id;
    if (ring.current) {
      ring.current.visible = selected;
      if (selected) {
        const p = 1 + 0.14 * Math.sin(state.clock.elapsedTime * 4);
        ring.current.scale.setScalar(p);
        ring.current.rotation.z += dt * 1.2;
      }
    }
  });

  const onSelect = (e: any) => {
    e.stopPropagation();
    useSwarm.getState().select(id);
  };

  return (
    <group
      ref={group}
      onClick={onSelect}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <pointLight ref={light} distance={4} intensity={6} color="#39ff7a" />
      {/* selection targeting reticle */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1.15, 0.05, 8, 4]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.9} />
      </mesh>
      {type === "uav" ? <Drone bodyRef={body} rotorsRef={rotors} /> : <Rover bodyRef={body} />}
      <Text
        ref={label}
        position={[0, type === "uav" ? 1.0 : 0.9, 0]}
        fontSize={0.5}
        color="#39ff7a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#03130a"
      >
        {id.replace("UAV_", "").replace("UGV_", "")}
      </Text>
    </group>
  );
}

function Drone({ bodyRef, rotorsRef }: { bodyRef: any; rotorsRef: any }) {
  const arm = (rot: number) => (
    <group rotation={[0, rot, 0]} key={rot}>
      <mesh position={[0.55, 0, 0]}>
        <boxGeometry args={[1.1, 0.05, 0.07]} />
        <meshStandardMaterial color="#0c2c1c" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[1.0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.04, 6, 16]} />
        <meshStandardMaterial color="#39ff7a" emissive="#39ff7a" emissiveIntensity={0.7} transparent opacity={0.55} />
      </mesh>
    </group>
  );
  return (
    <group scale={0.6}>
      <mesh>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial ref={bodyRef} color="#39ff7a" emissive="#39ff7a" emissiveIntensity={1.1} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* nose indicator (+x = heading) */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.35, 8]} />
        <meshStandardMaterial color="#c9ffe0" emissive="#c9ffe0" emissiveIntensity={0.6} />
      </mesh>
      <group ref={rotorsRef}>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(arm)}
      </group>
    </group>
  );
}

function Rover({ bodyRef }: { bodyRef: any }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.9, 0.28, 0.62]} />
        <meshStandardMaterial ref={bodyRef} color="#39ff7a" emissive="#39ff7a" emissiveIntensity={1.0} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.34, 0]}>
        <sphereGeometry args={[0.16, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9ffe0" emissive="#39ff7a" emissiveIntensity={0.5} />
      </mesh>
      {/* nose indicator */}
      <mesh position={[0.5, 0.12, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#c9ffe0" emissive="#c9ffe0" emissiveIntensity={0.6} />
      </mesh>
      {[[-0.32, -0.34], [0.32, -0.34], [-0.32, 0.34], [0.32, 0.34]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 10]} />
          <meshStandardMaterial color="#0c2c1c" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
