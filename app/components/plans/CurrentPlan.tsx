import type { Plan, Shop } from "../../types/robocall";
import { formatDayKey, formatNumber, formatUsd } from "../../utils/format";

const NEAR_LIMIT = 0.8;

interface CurrentPlanProps {
  plan: Plan;
  subscription: Shop["subscription"];
  usage: Shop["usage"];
}

export function CurrentPlan({ plan, subscription, usage }: CurrentPlanProps) {
  const limit = usage.orderLimit;
  const usedShare = limit ? usage.ordersThisMonth / limit : 0;
  const isTrial = subscription.status === "trial" && subscription.trialEndsOn;

  return (
    <>
      <div className="pk-row pk-row--between" style={{ gap: 24 }}>
        <div>
          <div className="pk-row">
            <span className="pk-plan__current">{plan.name}</span>
            {isTrial ? (
              <s-badge tone="info">Free trial</s-badge>
            ) : (
              <s-badge tone="success">Active</s-badge>
            )}
          </div>
          <s-paragraph color="subdued">{plan.tagline}</s-paragraph>
        </div>

        <div className="pk-row" style={{ gap: 28, alignItems: "flex-start" }}>
          <div style={{ minWidth: 170 }}>
            <div className="pk-figure__label">Orders this month</div>
            <div className="pk-figure__value">
              {`${formatNumber(usage.ordersThisMonth)} of ${limit ? formatNumber(limit) : "unlimited"}`}
            </div>
            {limit ? (
              <div
                className="pk-bar"
                style={{ marginTop: 6 }}
                role="progressbar"
                aria-label="Orders used this month"
                aria-valuemin={0}
                aria-valuemax={limit}
                aria-valuenow={usage.ordersThisMonth}
              >
                <div
                  className="pk-bar__fill"
                  style={{ width: `${Math.min(100, usedShare * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
          <div>
            <div className="pk-figure__label">Usage so far</div>
            <div className="pk-figure__value">
              {formatUsd(usage.usageChargesUsd)}
            </div>
            <div className="pk-plan__unit">{`${formatNumber(usage.answeredPulsesThisMonth)} answered pulses`}</div>
          </div>
          {isTrial && subscription.trialEndsOn ? (
            <div>
              <div className="pk-figure__label">Trial ends</div>
              <div className="pk-figure__value">
                {formatDayKey(subscription.trialEndsOn)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {usedShare > NEAR_LIMIT ? (
        <s-paragraph color="subdued">
          {`You've used ${Math.round(usedShare * 100)}% of this month's orders. Orders above the limit aren't called.`}
        </s-paragraph>
      ) : null}
    </>
  );
}
