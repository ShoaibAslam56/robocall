import { useElementSize } from "../../hooks/useElementSize";
import { CHART_COLORS } from "./colors";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarDatum {
  label: string;
  values: Record<string, number>;
}

interface StackedBarChartProps {
  data: readonly BarDatum[];
  series: readonly ChartSeries[];
  /** Short text for screen readers, e.g. "Calls per day for the last 7 days". */
  description: string;
  /** Grow to fill the parent's height (parent must be a flex column). */
  isFlexible?: boolean;
}

// Default drawing size; also what the server renders before measuring.
const DEFAULT_SIZE = { width: 640, height: 220 };
const PADDING = { top: 12, right: 8, bottom: 28, left: 32 };
const GRID_LINES = 4;
const MAX_X_LABELS = 10;

/** Rounds the axis max up to a "nice" number so gridlines land on whole values. */
export function niceMax(value: number): number {
  if (value <= GRID_LINES) return GRID_LINES;
  const step = Math.ceil(value / GRID_LINES);
  return step * GRID_LINES;
}

export function StackedBarChart({
  data,
  series,
  description,
  isFlexible = false,
}: StackedBarChartProps) {
  // In flexible mode the drawing uses the plot area's real pixel size, so
  // bars stretch to fill the card while text stays 11px.
  const { ref: plotRef, size } = useElementSize<HTMLDivElement>(DEFAULT_SIZE);
  const { width: WIDTH, height: HEIGHT } = isFlexible ? size : DEFAULT_SIZE;
  const totals = data.map((d) =>
    series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0),
  );
  const yMax = niceMax(Math.max(0, ...totals));
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(36, slot * 0.6);
  const labelEvery = Math.ceil(data.length / MAX_X_LABELS);
  const y = (v: number) => PADDING.top + plotH - (v / yMax) * plotH;

  return (
    <div className={`pk-chart${isFlexible ? " pk-chart--fill" : ""}`}>
      <div ref={plotRef} className={isFlexible ? "pk-chart__plot" : undefined}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          role="img"
          aria-label={description}
          style={{ display: "block" }}
        >
          {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
            const value = (yMax / GRID_LINES) * i;
            return (
              <g key={value}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y(value)}
                  y2={y(value)}
                  stroke={CHART_COLORS.grid}
                />
                <text
                  x={PADDING.left - 8}
                  y={y(value)}
                  fontSize="11"
                  fill={CHART_COLORS.axis}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = PADDING.left + slot * i + (slot - barW) / 2;
            let stackTop = 0;
            return (
              <g key={d.label}>
                <title>{`${d.label}: ${series
                  .map((s) => `${s.label} ${d.values[s.key] ?? 0}`)
                  .join(", ")}`}</title>
                {series.map((s) => {
                  const value = d.values[s.key] ?? 0;
                  if (value === 0) return null;
                  const top = y(stackTop + value);
                  const height = y(stackTop) - top;
                  stackTop += value;
                  return (
                    <rect
                      key={s.key}
                      x={x}
                      y={top}
                      width={barW}
                      height={height}
                      fill={s.color}
                    />
                  );
                })}
                {i % labelEvery === 0 ? (
                  <text
                    x={x + barW / 2}
                    y={HEIGHT - 8}
                    fontSize="11"
                    fill={CHART_COLORS.axis}
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <ChartLegend items={series} />
    </div>
  );
}

interface ChartLegendProps {
  items: ReadonlyArray<{ key: string; label: string; color: string }>;
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <s-stack direction="inline" gap="small" justifyContent="center">
      {items.map((item) => (
        <s-stack
          key={item.key}
          direction="inline"
          gap="small-200"
          alignItems="center"
        >
          <LegendDot color={item.color} />
          <s-text color="subdued">{item.label}</s-text>
        </s-stack>
      ))}
    </s-stack>
  );
}

export function LegendDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        inlineSize: 10,
        blockSize: 10,
        borderRadius: 3,
        background: color,
      }}
    />
  );
}
