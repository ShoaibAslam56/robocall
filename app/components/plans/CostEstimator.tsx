import { useState } from "react";

import { readValue, readValues, useDomEvent } from "../../hooks/useDomEvent";
import type { Plan } from "../../types/robocall";
import { formatNumber, formatUsd } from "../../utils/format";
import { estimateMonthlyCost } from "../../utils/pricing";
import { Select } from "../Select";

const ANSWER_RATE_OPTIONS = [50, 70, 90] as const;
const DEFAULT_ANSWER_RATE = 70;
const DEFAULT_MONTHLY_ORDERS = 500;
const MAX_ESTIMATE_ORDERS = 100_000;

interface CostEstimatorProps {
  plans: readonly Plan[];
  initialPlanId: string;
}

export function CostEstimator({ plans, initialPlanId }: CostEstimatorProps) {
  const [planId, setPlanId] = useState(initialPlanId);
  const [orders, setOrders] = useState(DEFAULT_MONTHLY_ORDERS);
  const [answerRate, setAnswerRate] = useState<number>(DEFAULT_ANSWER_RATE);

  const planRef = useDomEvent("change", (e) => setPlanId(readValue(e)));
  const ordersRef = useDomEvent("input", (e) => {
    const value = Number(readValue(e));
    // Ignore half-typed or silly values instead of showing NaN.
    setOrders(
      Number.isFinite(value)
        ? Math.min(Math.max(0, value), MAX_ESTIMATE_ORDERS)
        : 0,
    );
  });
  const rateRef = useDomEvent("change", (e) =>
    setAnswerRate(Number(readValues(e)[0] ?? DEFAULT_ANSWER_RATE)),
  );

  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const estimate = estimateMonthlyCost(plan, orders, answerRate);

  return (
    <div className="pk-grid pk-grid--2" style={{ alignItems: "start" }}>
      <div className="pk-stack">
        <div className="pk-grid pk-grid--2">
          <Select
            ref={planRef}
            label="Plan"
            value={planId}
            options={plans.map((p) => ({ value: p.id, label: p.name }))}
          />
          <s-number-field
            ref={ordersRef}
            label="Orders per month"
            value={String(DEFAULT_MONTHLY_ORDERS)}
            min={0}
            max={MAX_ESTIMATE_ORDERS}
            step={50}
          />
        </div>
        <s-choice-list
          ref={rateRef}
          name="answerRate"
          label="How many customers answer?"
        >
          {ANSWER_RATE_OPTIONS.map((rate) => (
            <s-choice
              key={rate}
              value={String(rate)}
              selected={rate === DEFAULT_ANSWER_RATE || undefined}
            >
              {`${rate}%${rate === DEFAULT_ANSWER_RATE ? " (typical in Pakistan)" : ""}`}
            </s-choice>
          ))}
        </s-choice-list>
      </div>

      <div className="pk-tile pk-tile--quiet">
        <EstimateRow
          label={`${plan.name} plan`}
          value={formatUsd(plan.monthlyUsd)}
        />
        <EstimateRow
          label="Answered calls"
          value={formatNumber(estimate.answeredCalls)}
        />
        <EstimateRow
          label={`Usage at ${formatUsd(plan.perPulseUsd)} each`}
          value={formatUsd(estimate.usageUsd)}
        />
        <div
          className="pk-row pk-row--between"
          style={{ borderTop: "1px solid var(--pk-border)", paddingTop: 10 }}
        >
          <s-text type="strong">Estimated total</s-text>
          <span className="pk-plan__price" style={{ fontSize: "1.25rem" }}>
            {`${formatUsd(estimate.totalUsd)}/mo`}
          </span>
        </div>
        {estimate.exceedsLimit && plan.orderLimit !== null ? (
          <s-text tone="critical">
            {`${plan.name} covers up to ${formatNumber(plan.orderLimit)} orders a month. Orders above that aren't called.`}
          </s-text>
        ) : null}
        <div className="pk-plan__unit">
          Assumes one call per order, under 30 seconds. Longer calls count as
          more pulses.
        </div>
      </div>
    </div>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="pk-row pk-row--between">
      <span className="pk-figure__label">{label}</span>
      <span className="pk-figure__value">{value}</span>
    </div>
  );
}
