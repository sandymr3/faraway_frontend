"use client";

import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import { useSwarm } from "@/lib/store";
import LandingScreen from "@/components/LandingScreen";
import DeploymentScreen from "@/components/DeploymentScreen";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  const booted = useSwarm((s) => s.booted);
  const connected = useSwarm((s) => s.connected);
  const [launched, setLaunched] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // Nothing connects until the operator clicks LAUNCH.
  useEffect(() => {
    if (launched) connectSocket();
  }, [launched]);

  // Hold the deployment screen briefly so the node-connect cascade can land.
  useEffect(() => {
    if (connected && !introDone) {
      const id = setTimeout(() => setIntroDone(true), 2300);
      return () => clearTimeout(id);
    }
  }, [connected, introDone]);

  if (!launched) return <LandingScreen onLaunch={() => setLaunched(true)} />;

  const showDash = booted && introDone;

  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {showDash ? <Dashboard /> : <DeploymentScreen />}
    </main>
  );
}
