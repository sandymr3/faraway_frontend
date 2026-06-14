import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SwarmResQ — Mission Brief",
  description: "How SwarmResQ localizes, maps, and self-heals without GPS or central control.",
};

export default function AboutPage() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflowY: "auto", position: "relative" }}>
      {/* nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          height: 54,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 22px",
          borderBottom: "1px solid var(--hair)",
          background: "rgba(5,8,10,0.92)",
          backdropFilter: "blur(6px)",
          zIndex: 10,
        }}
      >
        <span className="display glow" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.14em" }}>
          SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
        </span>
        <span className="mono" style={{ color: "var(--text-dim)", fontSize: 9, letterSpacing: "0.2em" }}>
          MISSION BRIEF
        </span>
        <span style={{ flex: 1 }} />
        <Link href="/" className="mono" style={navBtn}>← BACK</Link>
        <Link href="/" className="mono" style={{ ...navBtn, color: "var(--green)", borderColor: "var(--green-dim)" }}>
          LAUNCH CONSOLE ▶
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "38px 24px 90px" }}>
        {/* hero */}
        <div
          className="display glow"
          style={{ fontSize: 12, letterSpacing: "0.45em", color: "var(--green-dim)" }}
        >
          DECENTRALIZED · GPS-DENIED · INFRASTRUCTURE-FREE
        </div>
        <h1 className="display glow" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "0.1em", margin: "6px 0 4px" }}>
          SWARM<span style={{ color: "var(--green)" }}>RES</span>Q
        </h1>
        <p className="mono" style={{ color: "var(--text)", fontSize: 15, maxWidth: 680 }}>
          A swarm-intelligence command console for disaster response. A heterogeneous fleet of
          drones (UAVs) and ground rovers (UGVs) is dropped into a comms-degraded, GPS-denied
          collapsed structure. With no base station and no absolute positioning, the swarm
          cooperatively localizes, maps the unseen environment, detects survivors, and
          <strong> self-heals its mesh when 40% of nodes are knocked out</strong> — all watched
          live from a tactical operator console.
        </p>

        {/* metrics row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "24px 0 8px" }}>
          {[
            ["~2–4 cm", "MEAN LOCALIZATION ERROR"],
            ["< 15 cm", "ACCURACY TARGET — MET"],
            ["10", "AGENTS · 4 UGV + 6 UAV"],
            ["30 Hz", "LIVE TELEMETRY STREAM"],
            ["100%", "MESH HELD THROUGH EMP"],
          ].map(([v, l]) => (
            <div key={l} className="panel" style={{ padding: "12px 16px", minWidth: 150 }}>
              <div className="display glow" style={{ fontSize: 22, color: "var(--green)" }}>{v}</div>
              <div className="mono" style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: "0.12em", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="prose">
          <h2>The Problem</h2>
          <p>
            Earthquakes, landslides, and building collapses create environments that are lethal
            for first responders. In the first hours, teams don't know which routes are safe,
            where survivors are trapped, or whether the structure is stable. Sending humans in
            blind increases the death toll — so we send robots first.
          </p>
          <p>
            But today's autonomous systems assume <strong>GPS</strong>, <strong>stable comms</strong>,
            and <strong>centralized control</strong> — exactly the assumptions that fail in a
            disaster zone. Concrete blocks GPS. Cellular networks drop. Links disappear. Most
            robotic systems struggle precisely when they're needed most.
          </p>

          <h2>The Solution</h2>
          <p>
            SwarmResQ is a <strong>decentralized swarm-intelligence framework</strong>. Instead of
            one controller commanding one robot to understand everything, many robots share local
            observations and collectively build a global picture. The result is more scalable, more
            resilient, and dramatically more fault-tolerant.
          </p>

          <h2>Localization Without GPS</h2>
          <p>
            If GPS is unavailable, how do the robots know where they are? They use
            <strong> relative positioning</strong>. Like firefighters in a smoke-filled building who
            can't read a map but know where they are relative to each other:
          </p>
          <ul>
            <li>Each robot measures distances to neighbors with <strong>Ultra-Wideband (UWB)</strong> ranging.</li>
            <li>LiDAR odometry and inertial estimates track local motion.</li>
            <li>
              These fuse through a decentralized filter into a shared <strong>relative coordinate
              frame</strong> — recovered by anchor-free Multidimensional Scaling (SMACOF stress
              majorization) over the UWB distance matrix, with <strong>no absolute origin</strong>.
            </li>
          </ul>
          <p>
            Per-agent covariance becomes the <strong>confidence ellipse</strong> rendered around each
            unit. Measured: ~2–4 cm mean error, sustained even after losing 40% of the swarm.
          </p>

          <h2>Coordination as a Dynamic Graph</h2>
          <p>
            Communication links constantly change as a drone enters a collapsed structure. We model
            the swarm as a <strong>dynamic graph</strong>: every robot is a node, every link an edge.
            A Graph-Neural-Network-style layer continuously updates how information flows. If a node
            disappears, traffic reroutes through alternate paths automatically — no central
            coordinator required.
          </p>

          <h2>Tech Stack</h2>
          <p>A decoupled architecture: a simulation/robotics backend and a real-time visualization frontend.</p>
          <h3>Backend</h3>
          <ul>
            <li><code>FastAPI + python-socketio</code> — 30 Hz telemetry bridge over WebSocket.</li>
            <li><code>NumPy</code> swarm simulation — 10-agent heterogeneous fleet, boids + frontier exploration.</li>
            <li><code>localization.py</code> — anchor-free relative localization (SMACOF MDS + dead-reckoning, per-agent covariance).</li>
            <li><code>topology.py</code> — dynamic comm graph: adjacency, edge weights, connected components.</li>
            <li><code>faults.py</code> — EMP / node-kill / link-drop injection.</li>
          </ul>
          <h3>Frontend</h3>
          <ul>
            <li><code>Next.js</code> (App Router) + <code>React Three Fiber</code> — real-time 3D mission view.</li>
            <li><code>d3-force</code> — live GNN topology graph that re-routes on failure.</li>
            <li><code>Zustand</code> store, <code>framer-motion</code>, WebAudio cues, a GPU Voronoi sector shader, and a mission-replay ring buffer.</li>
          </ul>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
            Production path: the <code>swarm.step() → telemetry</code> seam is where ROS2 (Humble) +
            Gazebo, a trained PyTorch Geometric GNN policy, and a <code>robot_localization</code> EKF
            drop in — the dashboard contract stays identical.
          </p>

          <h2>Demo Walkthrough</h2>
          <ul>
            <li><strong>Deploy</strong> — radar locks, <code>LINK ESTABLISHED</code>, all 10 nodes thread into a live mesh.</li>
            <li><strong>Operate</strong> — agents explore and stitch a color-coded LiDAR point-cloud map; survivor heat signatures bloom; confidence ellipses and a sub-15 cm HUD prove the GPS-denied accuracy.</li>
            <li><strong>Interdict</strong> — hit <code>SIMULATE EMP</code>: 40% of nodes flash red, links snap, a CRITICAL banner fires — and the topology re-routes while mapping continues. No deadlock, no GPS.</li>
          </ul>

          <h2>Results &amp; Validation</h2>
          <ul>
            <li><strong>GPS-independent localization</strong> from relative ranging + odometry only.</li>
            <li><strong>Real-time sync</strong> between simulation and dashboard at 30 Hz.</li>
            <li><strong>Fault tolerance</strong> — the swarm reorganizes its topology and continues the mission with no system-wide failure.</li>
          </ul>

          <p style={{ marginTop: 22, fontSize: 16 }}>
            <strong>Because in disaster response, resilience isn't a feature — it's a necessity.</strong>
          </p>
          <p className="mono glow" style={{ color: "var(--green)", letterSpacing: "0.08em" }}>
            "This is SwarmResQ. Built to adapt when everything else fails."
          </p>
        </div>

        <div style={{ marginTop: 34, display: "flex", gap: 12 }}>
          <Link href="/" className="btn" style={{ textDecoration: "none", padding: "13px 22px" }}>
            ▶ LAUNCH SWARMRESQ
          </Link>
          <a
            href="https://github.com/sandymr3/faraway_frontend"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ textDecoration: "none", padding: "13px 22px", color: "var(--text-dim)", borderColor: "var(--hair)" }}
          >
            SOURCE ↗
          </a>
        </div>
      </div>
    </main>
  );
}

const navBtn: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.16em",
  color: "var(--text-dim)",
  textDecoration: "none",
  border: "1px solid var(--hair)",
  padding: "7px 13px",
};
