import type { SkipReason } from "../../types/robocall";
import { SKIP_REASONS } from "../../types/robocall";
import type { Funnel } from "../../utils/stats";
import { percentOf } from "../../utils/stats";
import { SKIP_REASON_LABELS, formatNumber } from "../../utils/format";
import { CHART_COLORS } from "../charts/colors";
import { LegendDot } from "../charts/StackedBarChart";
import type { IconName } from "../types";

interface OutcomeFunnelProps {
  funnel: Funnel;
  skips: Record<SkipReason, number>;
  windowLabel: string;
}

export function OutcomeFunnel({
  funnel,
  skips,
  windowLabel,
}: OutcomeFunnelProps) {
  const { notCalled } = funnel;
  const outcomes = [
    {
      key: "confirmed",
      label: "Confirmed (pressed 1)",
      value: funnel.outcomes.confirmed,
      color: CHART_COLORS.success,
    },
    {
      key: "cancelled",
      label: "Cancelled (pressed 2)",
      value: funnel.outcomes.cancelled,
      color: CHART_COLORS.critical,
    },
    {
      key: "callback",
      label: "Call-back (pressed 3)",
      value: funnel.outcomes.callback,
      color: CHART_COLORS.info,
    },
    {
      key: "unreachable",
      label: "Unreachable",
      value: funnel.outcomes.unreachable,
      color: CHART_COLORS.neutral,
    },
  ];

  return (
    <s-section heading="From order to outcome">
      <s-stack direction="block" gap="small">
        <s-text color="subdued">{`What happened to every order, ${windowLabel}.`}</s-text>

        <s-query-container>
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
            gap="small"
          >
            <FunnelStep
              icon="order"
              label="Orders received"
              value={funnel.received}
            />
            <FunnelStep
              icon="phone-out"
              label="Called"
              value={funnel.placed}
              share={percentOf(funnel.placed, funnel.received)}
            />
            <FunnelStep
              icon="phone-in"
              label="Answered"
              value={funnel.answered}
              share={percentOf(funnel.answered, funnel.placed)}
            />
            <s-box padding="base" background="subdued" borderRadius="large">
              <s-stack direction="block" gap="small">
                {outcomes.map((o) => (
                  <s-stack
                    key={o.key}
                    direction="inline"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <s-stack
                      direction="inline"
                      gap="small-200"
                      alignItems="center"
                    >
                      <LegendDot color={o.color} />
                      <s-text>{o.label}</s-text>
                    </s-stack>
                    <s-text type="strong">
                      {`${formatNumber(o.value)} · ${percentOf(o.value, funnel.placed)}%`}
                    </s-text>
                  </s-stack>
                ))}
              </s-stack>
            </s-box>
          </s-grid>
        </s-query-container>

        <s-divider />

        <s-stack direction="block" gap="small">
          <s-text type="strong">
            {`Not called: ${formatNumber(notCalled)} (${percentOf(notCalled, funnel.received)}% of orders)`}
          </s-text>
          <s-stack direction="inline" gap="small">
            {SKIP_REASONS.map((reason) => (
              <s-box
                key={reason}
                padding="small-100"
                paddingInline="small"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="small-200">
                  <s-text color="subdued">{SKIP_REASON_LABELS[reason]}</s-text>
                  {skips[reason] > 0 ? (
                    <s-link href={`/app/calls?skip=${reason}`}>
                      {String(skips[reason])}
                    </s-link>
                  ) : (
                    <s-text>0</s-text>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        </s-stack>
      </s-stack>
    </s-section>
  );
}

interface FunnelStepProps {
  icon: IconName;
  label: string;
  value: number;
  /** % of the previous step. Omitted for the first step. */
  share?: number;
}

function FunnelStep({ icon, label, value, share }: FunnelStepProps) {
  return (
    <s-box padding="base" border="base" borderRadius="large">
      <s-stack direction="block" gap="small-200">
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-icon type={icon} tone="info" />
          <s-text color="subdued">{label}</s-text>
        </s-stack>
        <s-heading>{formatNumber(value)}</s-heading>
        <s-text color="subdued">
          {share === undefined
            ? "All new orders"
            : `${share}% of previous step`}
        </s-text>
      </s-stack>
    </s-box>
  );
}
