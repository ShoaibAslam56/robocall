import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import {
  getShop,
  listPlanFaq,
  listPlanFeatures,
  listPlans,
} from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { CostEstimator } from "../components/plans/CostEstimator";
import { CurrentPlan } from "../components/plans/CurrentPlan";
import { FeatureMatrix } from "../components/plans/FeatureMatrix";
import { PricingCards } from "../components/plans/PricingCards";
import type { IconName } from "../components/types";
import { useDemoToast } from "../hooks/useDemoToast";

const TRUST_POINTS: ReadonlyArray<{ icon: IconName; label: string }> = [
  { icon: "calendar-check", label: "3-day free trial" },
  { icon: "phone-out", label: "Unanswered calls are free" },
  { icon: "x-circle", label: "Cancel any time" },
  { icon: "credit-card-secure", label: "Billed through Shopify" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [shop, plans, features, faq] = await Promise.all([
    getShop(),
    listPlans(),
    listPlanFeatures(),
    listPlanFaq(),
  ]);
  return {
    plans,
    features,
    faq,
    subscription: shop.subscription,
    usage: shop.usage,
  };
};

// A classic app pricing page: where you stand, a headline, plan cards
// with the price and button up top, reassurance, then details.
export default function Plans() {
  const { plans, features, faq, subscription, usage } =
    useLoaderData<typeof loader>();
  const showDemoToast = useDemoToast();
  const currentPlan = plans.find((p) => p.id === subscription.planId);

  return (
    <AppPage heading="Plans">
      {currentPlan ? (
        <div className="pk-card">
          <CurrentPlan
            plan={currentPlan}
            subscription={subscription}
            usage={usage}
          />
        </div>
      ) : null}

      <header className="pk-pricing-hero">
        <h2 className="pk-pricing-hero__title">
          Pick the plan that fits your orders
        </h2>
        <p className="pk-pricing-hero__sub">
          A small monthly fee, plus a few cents for each call a customer
          answers. Unanswered calls and retries never cost you anything.
        </p>
      </header>

      <PricingCards
        plans={plans}
        currentPlanId={subscription.planId}
        onChoose={(plan) =>
          showDemoToast(`would open Shopify Billing to approve ${plan.name}`)
        }
      />

      <div className="pk-trust">
        {TRUST_POINTS.map((point) => (
          <span key={point.label} className="pk-trust__item">
            <s-icon type={point.icon} size="small" tone="info" />
            {point.label}
          </span>
        ))}
      </div>

      <div className="pk-card">
        <div className="pk-cardhead">
          <div className="pk-cardhead__text">
            <s-heading>Estimate your monthly bill</s-heading>
            <s-paragraph color="subdued">
              Pick a plan and your order volume to see the plan fee plus usage.
            </s-paragraph>
          </div>
        </div>
        <CostEstimator
          plans={plans}
          initialPlanId={subscription.planId ?? plans[0].id}
        />
      </div>

      <div className="pk-card">
        <div className="pk-cardhead">
          <div className="pk-cardhead__text">
            <s-heading>Compare every feature</s-heading>
            <s-paragraph color="subdued">
              The full breakdown across every plan.
            </s-paragraph>
          </div>
        </div>
        <div className="pk-stack">
          <FeatureMatrix plans={plans} categories={features} />
        </div>
      </div>

      <div className="pk-card">
        <div className="pk-cardhead">
          <div className="pk-cardhead__text">
            <s-heading>Frequently asked questions</s-heading>
            <s-paragraph color="subdued">
              About billing, limits, and switching plans.
            </s-paragraph>
          </div>
        </div>
        <div className="pk-faq">
          {faq.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </AppPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
