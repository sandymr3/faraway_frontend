"use client";

import { motion } from "framer-motion";
import { simulateEMP, resetSwarm } from "@/lib/socket";
import { useSwarm } from "@/lib/store";

export default function ControlDeck() {
  const down = useSwarm((s) => s.metrics?.agents_down ?? 0);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="btn btn-danger"
        onClick={() => simulateEMP(0.4)}
        style={{ fontSize: 13, padding: "13px 22px", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span style={{ fontSize: 16 }}>⚡</span>
        SIMULATE EMP / DROP COMMS
      </motion.button>

      <button className="btn" onClick={() => resetSwarm()} style={{ padding: "13px 16px" }}>
        ⟳ REDEPLOY
      </button>

      {down > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mono glow-red"
          style={{
            color: "var(--red)",
            fontSize: 11,
            letterSpacing: "0.12em",
            border: "1px solid rgba(255,59,48,0.4)",
            padding: "8px 12px",
            background: "rgba(255,59,48,0.07)",
          }}
        >
          {down} NODES DOWN · MESH SELF-HEALING
        </motion.div>
      )}
    </div>
  );
}
