"use client";

import { Grid } from "@react-three/drei";
import { useSwarm } from "@/lib/store";
import AgentMesh from "./AgentMesh";
import CommLinks from "./CommLinks";
import PointCloud from "./PointCloud";
import Survivors from "./Survivors";
import ConfidenceEllipses from "./ConfidenceEllipses";
import MazeWalls from "./MazeWalls";

export default function Scene() {
  const roster = useSwarm((s) => s.meta?.roster ?? []);

  return (
    <group>
      <ambientLight intensity={0.18} color="#2a4a3a" />
      <directionalLight position={[10, 20, 8]} intensity={0.35} color="#39ff7a" />
      <hemisphereLight args={["#0a2a1a", "#020403", 0.4]} />

      <Grid
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#0d3a24"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#1f9e5a"
        fadeDistance={55}
        fadeStrength={1.5}
        infiniteGrid
        position={[0, 0, 0]}
      />

      <MazeWalls />
      <PointCloud />
      <ConfidenceEllipses />
      <CommLinks />
      <Survivors />

      {roster.map((r) => (
        <AgentMesh key={r.id} id={r.id} type={r.type} />
      ))}
    </group>
  );
}
