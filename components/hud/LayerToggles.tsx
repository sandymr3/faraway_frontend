"use client";

import { useSwarm } from "@/lib/store";

export default function LayerToggles() {
  const showSectors = useSwarm((s) => s.showSectors);
  const toggleSectors = useSwarm((s) => s.toggleSectors);

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 12,
        zIndex: 44,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Toggle on={showSectors} onClick={toggleSectors} label="SECTORS" hint="task allocation" />
    </div>
  );
}

function Toggle({
  on, onClick, label, hint,
}: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      title={hint}
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        fontSize: 10,
        letterSpacing: "0.14em",
        background: on ? "rgba(57,255,122,0.10)" : "rgba(5,10,8,0.7)",
        border: `1px solid ${on ? "var(--green-dim)" : "var(--hair)"}`,
        color: on ? "var(--green)" : "var(--text-dim)",
        cursor: "pointer",
        backdropFilter: "blur(2px)",
      }}
    >
      <span
        style={{
          width: 22,
          height: 12,
          borderRadius: 7,
          background: on ? "var(--green-dim)" : "rgba(255,255,255,0.08)",
          position: "relative",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 1,
            left: on ? 11 : 1,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: on ? "var(--green)" : "var(--text-dim)",
            boxShadow: on ? "0 0 6px var(--green)" : "none",
            transition: "all 0.15s",
          }}
        />
      </span>
      {label}
    </button>
  );
}
