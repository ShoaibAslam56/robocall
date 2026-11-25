import type { AddressQuality } from "../../types/robocall";
import { ADDRESS_DISPLAY, formatNumber } from "../../utils/format";
import { percentOf, type AddressIssue } from "../../utils/stats";
import { CHART_COLORS } from "../charts/colors";
import { DonutChart, type DonutSegment } from "../charts/DonutChart";
import { LegendDot } from "../charts/StackedBarChart";

interface AddressQualityCardProps {
  counts: Record<AddressQuality, number>;
  /** Worst addresses in the period, already sorted (see worstAddresses). */
  issues: readonly AddressIssue[];
}

export function AddressQualityCard({
  counts,
  issues,
}: AddressQualityCardProps) {
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
    <div className="pk-card pk-stack">
      <div className="pk-cardhead" style={{ marginBottom: 0 }}>
        <div className="pk-cardhead__text">
          <s-heading>Address check</s-heading>
          <s-paragraph color="subdued">
            AI scores every delivery address so you can fix bad ones before the
            courier leaves.
          </s-paragraph>
        </div>
      </div>

      <div className="pk-row" style={{ gap: 16, flexWrap: "nowrap" }}>
        <DonutChart
          segments={segments}
          centerValue={formatNumber(total)}
          centerLabel="orders"
          description={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
        />
        <div className="pk-stack pk-stack--tight">
          {segments.map((s) => (
            <div key={s.key} className="pk-row">
              <LegendDot color={s.color} />
              <s-text>{s.label}</s-text>
              <s-text color="subdued">{`${formatNumber(s.value)} (${percentOf(s.value, total)}%)`}</s-text>
            </div>
          ))}
          <s-link href="/app/settings/protection">Change scoring rules</s-link>
        </div>
      </div>

      <div className="pk-price-card__divider" />

      <div>
        <div className="pk-row pk-row--between" style={{ marginBottom: 6 }}>
          <span className="pk-list__title">Fix these first</span>
          {/* The link filters to incomplete only, so the count must match. */}
          {counts.incomplete > 0 ? (
            <s-link href="/app/calls?address=incomplete">{`View ${formatNumber(counts.incomplete)} incomplete`}</s-link>
          ) : null}
        </div>
        {issues.length === 0 ? (
          <s-paragraph color="subdued">
            Every address in this period is complete.
          </s-paragraph>
        ) : (
          <div className="pk-list">
            {issues.map((issue) => {
              const display = ADDRESS_DISPLAY[issue.quality];
              return (
                <div key={issue.id} className="pk-list__row">
                  <div className="pk-grow">
                    <div className="pk-list__title">
                      <s-link href={`/app/calls/${issue.id}`}>
                        {issue.orderName}
                      </s-link>
                      {` · ${issue.customerName}`}
                    </div>
                    <div className="pk-list__meta">{`${issue.city} · score ${issue.score}/100`}</div>
                  </div>
                  <s-badge tone={display.tone}>{display.label}</s-badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
