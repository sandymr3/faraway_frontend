"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSwarm } from "@/lib/store";
import { setMuted, isMuted } from "@/lib/audio";

function fmt(t: number) {
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ReplayBar() {
  const histLen = useSwarm((s) => s.history.length);
  const replay = useSwarm((s) => s.replay);
  const enterReplay = useSwarm((s) => s.enterReplay);
  const exitReplay = useSwarm((s) => s.exitReplay);
  const setReplayIndex = useSwarm((s) => s.setReplayIndex);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMutedState] = useState(false);
  const raf = useRef<number>(0);
  const acc = useRef(0);
  const lastT = useRef(0);

  const maxIdx = Math.max(0, histLen - 1);
  const idx = replay.active ? replay.index : maxIdx;

  // EMP markers: indices where the downed-node count jumped.
  const markers = useMemo(() => {
    const h = useSwarm.getState().history;
    const out: number[] = [];
    for (let i = 1; i < h.length; i++) {
      if (h[i].metrics.agents_down > h[i - 1].metrics.agents_down) out.push(i);
    }
    return out;
  }, [histLen, replay.active]);

  // Playback loop (replay mode only).
  useEffect(() => {
    if (!playing || !replay.active) return;
    lastT.current = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastT.current) / 1000;
      lastT.current = now;
      acc.current += dt * 30 * speed; // 30 frames/sec * speed
      if (acc.current >= 1) {
        const step = Math.floor(acc.current);
        acc.current -= step;
        const cur = useSwarm.getState().replay.index;
        const end = useSwarm.getState().history.length - 1;
        const next = cur + step;
        if (next >= end) {
          setReplayIndex(end);
          setPlaying(false);
          return;
        }
        setReplayIndex(next);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, replay.active, speed, setReplayIndex]);

  const curT = histLen ? useSwarm.getState().history[idx]?.t ?? 0 : 0;
  const totalT = histLen ? useSwarm.getState().history[maxIdx]?.t ?? 0 : 0;
  const bufferSec = Math.round(totalT - (useSwarm.getState().history[0]?.t ?? 0));

  const toggleMute = () => {
    const m = !muted;
    setMutedState(m);
    setMuted(m);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 46,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 14px",
        background: "linear-gradient(0deg, rgba(4,8,7,0.95), rgba(4,8,7,0.6))",
        borderTop: "1px solid var(--hair)",
        zIndex: 45,
      }}
    >
      {/* LIVE / REPLAY toggle */}
      {!replay.active ? (
        <button
          className="btn"
          onClick={enterReplay}
          disabled={histLen < 2}
          style={{ padding: "7px 12px", fontSize: 11, display: "flex", gap: 7, alignItems: "center" }}
        >
          <span style={{ fontSize: 13 }}>⏮</span> REVIEW
        </button>
      ) : (
        <>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="btn"
            style={{ padding: "7px 11px", fontSize: 13, minWidth: 38 }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => setSpeed((sp) => (sp === 1 ? 4 : sp === 4 ? 8 : 1))}
            className="btn"
            style={{ padding: "7px 9px", fontSize: 11 }}
          >
            {speed}×
          </button>
        </>
      )}

      {/* status pill */}
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: replay.active ? "var(--amber)" : "var(--green)",
        }}
      >
        <span className={`dot ${replay.active ? "dot-isolated" : "dot-active"} ${replay.active ? "" : "blink"}`} />
        {replay.active ? "REPLAY" : "LIVE"}
      </div>

      {/* scrubber */}
      <div style={{ position: "relative", flex: 1, height: 24, display: "flex", alignItems: "center" }}>
        {/* EMP markers */}
        {markers.map((m) => (
          <div
            key={m}
            title="EMP event"
            style={{
              position: "absolute",
              left: `${maxIdx ? (m / maxIdx) * 100 : 0}%`,
              top: 2,
              width: 2,
              height: 20,
              background: "var(--red)",
              boxShadow: "0 0 6px var(--red)",
              transform: "translateX(-1px)",
              pointerEvents: "none",
            }}
          />
        ))}
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={idx}
          onChange={(e) => {
            setPlaying(false);
            setReplayIndex(parseInt(e.target.value, 10));
          }}
          style={{ width: "100%", accentColor: replay.active ? "#ffb000" : "#39ff7a", cursor: "pointer" }}
        />
      </div>

      {/* time readout */}
      <div className="mono" style={{ fontSize: 11, color: "var(--text)", minWidth: 96, textAlign: "right" }}>
        T+{fmt(curT)} <span style={{ color: "var(--text-dim)" }}>/ {fmt(totalT)}</span>
      </div>

      {replay.active && (
        <button className="btn" onClick={() => { setPlaying(false); exitReplay(); }} style={{ padding: "7px 12px", fontSize: 11 }}>
          ⊙ LIVE
        </button>
      )}

      {/* sound toggle */}
      <button
        onClick={toggleMute}
        title={muted ? "Unmute cues" : "Mute cues"}
        className="btn"
        style={{ padding: "7px 10px", fontSize: 13, color: muted ? "var(--text-dim)" : "var(--green)", borderColor: muted ? "var(--text-dim)" : "var(--green-dim)" }}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <span className="mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
        BUF {bufferSec}s
      </span>
    </div>
  );
}
