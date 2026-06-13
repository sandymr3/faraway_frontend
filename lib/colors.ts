// Per-agent phosphor palette — distinct hues that still read as "signal" colours
// against the near-black tactical background.
export const AGENT_COLORS = [
  "#39ff7a", // signal green
  "#00e5ff", // cyan
  "#ffb000", // amber
  "#ff5cf0", // magenta
  "#7cff3f", // lime
  "#5b8cff", // azure
  "#ff8a3d", // orange
  "#46ffd1", // teal
  "#d6ff3f", // chartreuse
  "#ff6b6b", // coral
];

export const THEME = {
  green: "#39ff7a",
  greenDim: "#1f7a45",
  amber: "#ffb000",
  red: "#ff3b30",
  cyan: "#00e5ff",
  bg: "#05080a",
  grid: "#103a26",
};

export function agentColor(index: number): string {
  return AGENT_COLORS[((index % AGENT_COLORS.length) + AGENT_COLORS.length) % AGENT_COLORS.length];
}
