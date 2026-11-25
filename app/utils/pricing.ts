import type { Plan } from "../types/robocall";

// Calls are billed per answered "pulse": each started 30 seconds counts as one.
export const PULSE_SECONDS = 30;

export function pulsesFor(durationSeconds: number): number {
  return Math.max(1, Math.ceil(durationSeconds / PULSE_SECONDS));
}

export interface CostEstimate {
  answeredCalls: number;
  usageUsd: number;
  totalUsd: number;
  exceedsLimit: boolean;
}

/** Monthly cost for a plan, assuming one call per order. */
export function estimateMonthlyCost(
  plan: Plan,
  monthlyOrders: number,
  answerRatePercent: number,
  pulsesPerCall = 1,
): CostEstimate {
  const orders = Math.max(0, Math.floor(monthlyOrders));
  const answeredCalls = Math.round((orders * answerRatePercent) / 100);
  const usageUsd = roundCents(answeredCalls * pulsesPerCall * plan.perPulseUsd);
  return {
    answeredCalls,
    usageUsd,
    totalUsd: roundCents(plan.monthlyUsd + usageUsd),
    exceedsLimit: plan.orderLimit !== null && orders > plan.orderLimit,
  };
}

/** One-off cost for a bulk campaign. */
export function estimateCampaignCost(
  audienceSize: number,
  answerRatePercent: number,
  messageSeconds: number,
  perPulseUsd: number,
): { answeredCalls: number; totalUsd: number } {
  const answeredCalls = Math.round((audienceSize * answerRatePercent) / 100);
  return {
    answeredCalls,
    totalUsd: roundCents(
      answeredCalls * pulsesFor(messageSeconds) * perPulseUsd,
    ),
  };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
