// audio.ts — Tiny WebAudio cue engine for the operator console.
// Lazily creates an AudioContext and unlocks it on the first user gesture
// (browser autoplay policy). All cues are synthesized — no asset files.

let ctx: AudioContext | null = null;
let muted = false;
let unlocked = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Unlock the audio context on the first pointer/key interaction.
if (typeof window !== "undefined") {
  const unlock = () => {
    ensure();
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  glideTo?: number
) {
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Cue = "survivor" | "emp" | "connect" | "tick";

export function play(cue: Cue) {
  if (muted) return;
  switch (cue) {
    case "survivor": // bright two-tone sonar "found" blip
      tone(660, 0, 0.14, "sine", 0.18);
      tone(990, 0.1, 0.22, "sine", 0.16);
      break;
    case "emp": // descending alarm sweep + low thud
      tone(880, 0, 0.5, "sawtooth", 0.16, 120);
      tone(70, 0.0, 0.45, "square", 0.12);
      tone(880, 0.55, 0.5, "sawtooth", 0.12, 120);
      break;
    case "connect": // soft confirm
      tone(520, 0, 0.09, "triangle", 0.12);
      break;
    case "tick":
      tone(440, 0, 0.04, "square", 0.05);
      break;
  }
}
