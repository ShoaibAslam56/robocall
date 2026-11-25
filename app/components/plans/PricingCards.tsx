import type { Plan } from "../../types/robocall";
import { formatNumber, formatUsd } from "../../utils/format";

interface PricingCardsProps {
  plans: readonly Plan[];
  currentPlanId: string | null;
  onChoose: (plan: Plan) => void;
}

// Classic pricing cards: name → price → button → what's included.
// The button sits right under the price (not at the bottom), because
// that's where people decide.
export function PricingCards({
  plans,
  currentPlanId,
  onChoose,
}: PricingCardsProps) {
  const current = plans.find((p) => p.id === currentPlanId);
  const nameOf = (id: string | null) => plans.find((p) => p.id === id)?.name;

  return (
    <div className="pk-grid pk-grid--3 pk-price-cards">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isUpgrade = !current || plan.monthlyUsd > current.monthlyUsd;
        const basedOnName = nameOf(plan.basedOn);
        const className = [
          "pk-price-card",
          plan.recommended ? "is-popular" : "",
          isCurrent ? "is-current" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={plan.id} className={className}>
            {plan.recommended ? (
              <span className="pk-price-card__ribbon">Most popular</span>
            ) : null}

            <div>
              <div className="pk-row pk-row--between">
                <span className="pk-price-card__name">{plan.name}</span>
                {isCurrent ? <s-badge tone="info">Current plan</s-badge> : null}
              </div>
              <p className="pk-price-card__tagline">{plan.tagline}</p>
            </div>

            <div>
              <div className="pk-price-card__price">
                <span className="pk-price-card__amount">
                  {formatUsd(plan.monthlyUsd).replace(".00", "")}
                </span>
                <span className="pk-price-card__per">/ month</span>
              </div>
              <div className="pk-price-card__usage">
                {`+ ${formatUsd(plan.perPulseUsd)} per answered call (30 sec)`}
              </div>
            </div>

            {isCurrent ? (
              <s-button disabled>Your current plan</s-button>
            ) : (
              <s-button
                variant={plan.recommended ? "primary" : "secondary"}
                onClick={() => onChoose(plan)}
              >
                {isUpgrade
                  ? `Upgrade to ${plan.name}`
                  : `Switch to ${plan.name}`}
              </s-button>
            )}

            <div className="pk-price-card__divider" />

            <div className="pk-stack pk-stack--tight">
              <span className="pk-price-card__includes">
                {basedOnName
                  ? `Everything in ${basedOnName}, plus:`
                  : "Includes:"}
              </span>
              <ul className="pk-price-card__list">
                <li>
                  <Check />
                  <span>
                    {plan.orderLimit === null
                      ? "Unlimited orders"
                      : `Up to ${formatNumber(plan.orderLimit)} orders a month`}
                  </span>
                </li>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Check() {
  return (
    <span className="pk-price-card__check" aria-hidden="true">
      <s-icon type="check" size="small" />
    </span>
  );
}
