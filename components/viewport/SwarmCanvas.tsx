"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Scene from "./Scene";
import { useSwarm } from "@/lib/store";

export default function SwarmCanvas() {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 26, 30], fov: 42, near: 0.1, far: 300 }}
      onPointerMissed={() => useSwarm.getState().select(null)}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(0x05080a, 0.012);
      }}
    >
      <color attach="background" args={["#05080a"]} />

      <Scene />

      <OrbitControls
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={70}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />

      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
