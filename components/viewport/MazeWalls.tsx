"use client";

import { Edges } from "@react-three/drei";
import { useSwarm } from "@/lib/store";

const WALL_H = 2.8;

export default function MazeWalls() {
  const meta = useSwarm((s) => s.meta);
  if (!meta) return null;
  const b = meta.bounds;

  return (
    <group>
      {meta.obstacles.map((o, i) => (
        <mesh key={i} position={[o.cx, WALL_H / 2, o.cy]}>
          <boxGeometry args={[o.w, WALL_H, o.h]} />
          <meshStandardMaterial
            color="#06140d"
            transparent
            opacity={0.55}
            metalness={0.2}
            roughness={0.8}
          />
          <Edges threshold={15} color="#1f9e5a" />
        </mesh>
      ))}

      {/* operational boundary */}
      <lineLoop position={[0, 0.02, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              -b, 0, -b, b, 0, -b, b, 0, b, -b, 0, b, -b, 0, -b,
            ])}
            count={5}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1f9e5a" transparent opacity={0.5} />
      </lineLoop>
    </group>
  );
}
