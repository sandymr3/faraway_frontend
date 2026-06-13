// Shared helpers for the 3D viewport.
// Backend frame: (x, y) ground plane + altitude. Three.js: Y is up, so we map
// backend (x, y, alt) -> three (x, alt, y).

export function toThree(x: number, y: number, alt = 0): [number, number, number] {
  return [x, alt, y];
}

export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

// Eigen-decomposition of a symmetric 2x2 covariance → ellipse axes + rotation.
export function covEllipse(cov: [[number, number], [number, number]]) {
  const a = cov[0][0];
  const b = cov[0][1];
  const d = cov[1][1];
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  let angle = 0;
  if (Math.abs(b) > 1e-9) angle = Math.atan2(l1 - a, b);
  else angle = a >= d ? 0 : Math.PI / 2;
  // 2-sigma radii (metres), clamped for visibility.
  const rx = Math.min(4, 2 * Math.sqrt(Math.max(l1, 1e-4)));
  const ry = Math.min(4, 2 * Math.sqrt(Math.max(l2, 1e-4)));
  return { rx, ry, angle };
}
