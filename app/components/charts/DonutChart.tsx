import { CHART_COLORS } from "./colors";

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: readonly DonutSegment[];
  centerValue: string;
  centerLabel: string;
  description: string;
}

const SIZE = 140;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Each segment is a circle whose dash covers its share of the ring.
// strokeDashoffset rotates where the dash starts so segments sit end to end.
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  description,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label={description}
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={CHART_COLORS.grid}
        strokeWidth={STROKE}
      />
      {total > 0 &&
        segments.map((s) => {
          const length = (s.value / total) * CIRCUMFERENCE;
          const circle = (
            <circle
              key={s.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          );
          offset += length;
          return circle;
        })}
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontSize="22"
        fontWeight="650"
        fill="#303030"
      >
        {centerValue}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontSize="11"
        fill={CHART_COLORS.axis}
      >
        {centerLabel}
      </text>
    </svg>
  );
}
