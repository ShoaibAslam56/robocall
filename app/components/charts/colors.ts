// Chart colors, matched to Polaris tones so charts sit naturally next to
// <s-badge tone="success|critical|..."> elsewhere on the page.
// Polaris has no chart component, so charts are plain SVG and need hex values.
export const CHART_COLORS = {
  success: "#29845a",
  critical: "#e22c38",
  caution: "#e8a200",
  info: "#2c6ecb",
  neutral: "#b5b5b5",
  grid: "#e3e3e3",
  axis: "#616161",
} as const;
