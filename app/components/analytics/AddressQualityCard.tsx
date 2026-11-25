import type { AddressQuality } from "../../types/robocall";
import { formatNumber } from "../../utils/format";
import { percentOf } from "../../utils/stats";
import { CHART_COLORS } from "../charts/colors";
import { DonutChart, type DonutSegment } from "../charts/DonutChart";
import { LegendDot } from "../charts/StackedBarChart";

interface AddressQualityCardProps {
  counts: Record<AddressQuality, number>;
}

export function AddressQualityCard({ counts }: AddressQualityCardProps) {
  const total = counts.complete + counts.partial + counts.incomplete;
  const segments: DonutSegment[] = [
    {
      key: "complete",
      label: "Complete",
      value: counts.complete,
      color: CHART_COLORS.success,
    },
    {
      key: "partial",
      label: "Partial",
      value: counts.partial,
      color: CHART_COLORS.caution,
    },
    {
      key: "incomplete",
      label: "Incomplete",
      value: counts.incomplete,
      color: CHART_COLORS.critical,
    },
  ];

  return (
    <div className="pk-card">
      <div className="pk-cardhead">
        <s-heading>Address check</s-heading>
      </div>
      <s-stack direction="block" gap="small">
        <s-text color="subdued">
          AI scores every delivery address so you can fix bad ones before the
          courier leaves.
        </s-text>
        <s-stack direction="inline" gap="base" alignItems="center">
          <DonutChart
            segments={segments}
            centerValue={formatNumber(total)}
            centerLabel="orders"
            description={segments
              .map((s) => `${s.label}: ${s.value}`)
              .join(", ")}
          />
          <s-stack direction="block" gap="small">
            {segments.map((s) => (
              <s-stack
                key={s.key}
                direction="inline"
                gap="small"
                alignItems="center"
              >
                <LegendDot color={s.color} />
                <s-text>{s.label}</s-text>
                <s-text color="subdued">
                  {`${formatNumber(s.value)} (${percentOf(s.value, total)}%)`}
                </s-text>
              </s-stack>
            ))}
            <s-link href="/app/settings/protection">
              Change scoring rules
            </s-link>
          </s-stack>
        </s-stack>
      </s-stack>
    </div>
  );
}
