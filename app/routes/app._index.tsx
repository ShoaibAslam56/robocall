import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import {
  getSettings,
  getShop,
  listCalls,
  listCampaigns,
  listPlans,
  listSetupSteps,
  listVoices,
} from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { Notice } from "../components/Notice";
import { NeedsAttention } from "../components/dashboard/NeedsAttention";
import { DashboardTiles } from "../components/dashboard/DashboardTiles";
import { SetupGuide } from "../components/dashboard/SetupGuide";
import { StatusCard } from "../components/dashboard/StatusCard";
import { useDemoToast } from "../hooks/useDemoToast";
import {
  daysBetween,
  getRangeWindows,
  isInWindow,
  toDayKey,
} from "../utils/dates";
import { formatNumber } from "../utils/format";
import { formatTimeLabel } from "../utils/time";
import { computeAttention } from "../utils/stats";

// The Dashboard answers "what should I do right now?".
// Numbers and charts ("how is it going?") live on the Analytics page.

const ATTENTION_DAYS = 7;
const REVIEW_WINDOW_DAYS = 30;
const REVIEW_PROMPT_MIN_CONFIRMED = 50;
const TRIAL_WARNING_DAYS = 3;
const PROTECTION_CHECKS = 3;

/** "Good morning" etc. in the shop's time zone, worked out on the server so
 *  the server and browser render the same text. */
function greetingFor(timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const [shop, calls, setupSteps, settings, plans, campaigns, voices] =
    await Promise.all([
      getShop(),
      listCalls(),
      listSetupSteps(),
      getSettings(),
      listPlans(),
      listCampaigns(),
      listVoices(),
    ]);
  const { general, calling, protection } = settings;
  const dayOf = (iso: string) => toDayKey(iso, shop.timezone);
  const lastDays = (days: number) => {
    const { current } = getRangeWindows(shop.today, days);
    return calls.filter((c) => isInWindow(dayOf(c.orderCreatedAt), current));
  };

  return {
    greeting: `${greetingFor(shop.timezone)}, ${shop.name}`,
    setupSteps,
    tiles: {
      storeName: general.storeName,
      isThankYouNoticeOn: general.thankYouNoticeEnabled,
      runningCampaign: campaigns.find((c) => c.status === "running") ?? null,
      voiceName:
        voices.find((v) => v.id === calling.defaultVoiceId)?.name ?? "Not set",
    },
    status: {
      callingOn: general.appEnabled,
      callMode: general.callMode,
      hours:
        calling.callingWindow === "always"
          ? "any time"
          : `${formatTimeLabel(calling.callingHoursStart)}–${formatTimeLabel(calling.callingHoursEnd)}`,
      checksOn: [
        protection.addressValidator.enabled,
        protection.duplicates.enabled,
        protection.invalidNumbers.enabled,
      ].filter(Boolean).length,
      planName:
        plans.find((p) => p.id === shop.subscription.planId)?.name ?? "No plan",
      isTrial: shop.subscription.status === "trial",
      ordersThisMonth: shop.usage.ordersThisMonth,
      orderLimit: shop.usage.orderLimit,
    },
    attention: computeAttention(lastDays(ATTENTION_DAYS)),
    confirmedRecently: lastDays(REVIEW_WINDOW_DAYS).filter(
      (c) => c.status === "confirmed",
    ).length,
    trialDaysLeft:
      shop.subscription.status === "trial" && shop.subscription.trialEndsOn
        ? daysBetween(shop.today, shop.subscription.trialEndsOn)
        : null,
  };
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const { status } = data;
  const isSetupDone = data.setupSteps.every((s) => s.done);

  return (
    <AppPage
      heading="Dashboard"
      primaryAction={
        <s-button
          slot="primary-action"
          variant="primary"
          href="/app/campaigns/new"
        >
          New campaign
        </s-button>
      }
      secondaryActions={
        <s-button slot="secondary-actions" href="/app/analytics">
          View analytics
        </s-button>
      }
    >
      <header className="pk-greeting">
        <span className="pk-greeting__hello">{data.greeting}</span>
        <h2 className="pk-greeting__title">
          Here&apos;s what needs you today.
        </h2>
      </header>

      <DashboardNotice
        trialDaysLeft={data.trialDaysLeft}
        // Only ask for a review once the app has clearly helped the store.
        canAskForReview={
          isSetupDone && data.confirmedRecently >= REVIEW_PROMPT_MIN_CONFIRMED
        }
        confirmed={data.confirmedRecently}
      />

      <div className="pk-grid pk-grid--3">
        <StatusCard
          icon="phone-out"
          title="Calling"
          badge={
            status.callingOn
              ? { tone: "success", label: "On" }
              : { tone: "warning", label: "Off" }
          }
          body={
            status.callingOn
              ? `${status.callMode === "auto" ? "Automatic" : "Manual"} calls, ${status.hours}.`
              : "New orders aren't being called. Turn calling on to confirm them."
          }
          action={
            <s-button href="/app/settings">
              {status.callingOn ? "Manage" : "Turn on"}
            </s-button>
          }
        />
        <StatusCard
          icon="shield-check-mark"
          title="Order protection"
          badge={
            status.checksOn === PROTECTION_CHECKS
              ? { tone: "success", label: "All on" }
              : {
                  tone: "warning",
                  label: `${status.checksOn} of ${PROTECTION_CHECKS} on`,
                }
          }
          body="Address check, duplicate orders, and invalid numbers, caught before you call."
          action={<s-button href="/app/settings/protection">Review</s-button>}
        />
        <StatusCard
          icon="plan"
          title="Plan"
          badge={
            status.isTrial
              ? { tone: "info", label: "Free trial" }
              : { tone: "success", label: "Active" }
          }
          body={`${status.planName} · ${formatNumber(status.ordersThisMonth)} of ${status.orderLimit ? formatNumber(status.orderLimit) : "unlimited"} orders this month.`}
          action={<s-button href="/app/plans">View plan</s-button>}
        />
      </div>

      <div className="pk-grid pk-grid--2 pk-grid--equal">
        <SetupGuide steps={data.setupSteps} />
        <NeedsAttention
          counts={data.attention}
          periodLabel={`Last ${ATTENTION_DAYS} days`}
        />
      </div>

      <DashboardTiles {...data.tiles} />
    </AppPage>
  );
}

interface DashboardNoticeProps {
  trialDaysLeft: number | null;
  canAskForReview: boolean;
  confirmed: number;
}

// At most ONE notice at a time. Stacking banners trains merchants to
// ignore all of them.
function DashboardNotice({
  trialDaysLeft,
  canAskForReview,
  confirmed,
}: DashboardNoticeProps) {
  const showDemoToast = useDemoToast();

  if (trialDaysLeft !== null && trialDaysLeft <= TRIAL_WARNING_DAYS) {
    const when =
      trialDaysLeft <= 0
        ? "today"
        : `in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}`;
    return (
      <Notice
        heading={`Your free trial ends ${when}`}
        action={<s-button href="/app/plans">Review plan</s-button>}
      >
        Calls keep running after the trial. You only pay for answered calls.
      </Notice>
    );
  }

  if (canAskForReview) {
    return (
      <Notice
        tone="success"
        heading={`${formatNumber(confirmed)} orders confirmed by phone this month`}
        isDismissible
        action={
          <s-button
            onClick={() =>
              showDemoToast("this would open the App Store review page")
            }
          >
            Leave a review
          </s-button>
        }
      >
        If Pakka is saving you time, a short review helps other Pakistani stores
        find it.
      </Notice>
    );
  }

  return null;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
