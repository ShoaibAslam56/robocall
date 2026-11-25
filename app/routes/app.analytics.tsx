import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getShop, listCalls } from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { MetricCard } from "../components/MetricCard";
import { Select } from "../components/Select";
import { StackedBarChart } from "../components/charts/StackedBarChart";
import { CHART_COLORS } from "../components/charts/colors";
import { AddressQualityCard } from "../components/analytics/AddressQualityCard";
import { OutcomeFunnel } from "../components/analytics/OutcomeFunnel";
import { readValue, useDomEvent } from "../hooks/useDomEvent";
import { getRangeWindows, isInWindow, toDayKey } from "../utils/dates";
import {
  computeDailyTrend,
  computeFunnel,
  computeKpis,
  countAddressQuality,
  countSkipReasons,
  percentChange,
} from "../utils/stats";
import {
  formatDayKey,
  formatMoney,
  formatNumber,
  formatPercent,
} from "../utils/format";

const RANGE_OPTIONS = [7, 30] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];

function parseRange(value: string | null): RangeDays {
  return RANGE_OPTIONS.find((r) => String(r) === value) ?? 7;
}

// Loaders run on the server before the page renders. This one only reads
// mock JSON and does math, so the component just displays the results.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const range = parseRange(new URL(request.url).searchParams.get("range"));
  const [shop, calls] = await Promise.all([getShop(), listCalls()]);

  const windows = getRangeWindows(shop.today, range);
  const dayOf = (iso: string) => toDayKey(iso, shop.timezone);
  const current = calls.filter((c) =>
    isInWindow(dayOf(c.orderCreatedAt), windows.current),
  );
  const previous = calls.filter((c) =>
    isInWindow(dayOf(c.orderCreatedAt), windows.previous),
  );

  return {
    range,
    windowLabel: `${formatDayKey(windows.current.start)} – ${formatDayKey(windows.current.end)}`,
    currency: shop.currency,
    kpis: computeKpis(current),
    previousKpis: computeKpis(previous),
    funnel: computeFunnel(current),
    skips: countSkipReasons(current),
    trend: computeDailyTrend(current, windows.current, shop.timezone),
    addressQuality: countAddressQuality(current),
  };
};

const pointsChange = (current: number | null, previous: number | null) =>
  current === null || previous === null ? null : current - previous;

export default function Analytics() {
  const data = useLoaderData<typeof loader>();
  const { kpis, previousKpis, range, currency } = data;
  const [, setSearchParams] = useSearchParams();
  const rangeRef = useDomEvent("change", (event) => {
    setSearchParams({ range: readValue(event) });
  });
  const previousLabel = `previous ${range} days`;

  return (
    <AppPage
      heading="Analytics"
      secondaryActions={
        <s-button slot="secondary-actions" href="/app/calls">
          Call logs
        </s-button>
      }
    >
      <s-stack
        direction="inline"
        justifyContent="space-between"
        alignItems="center"
        gap="small"
      >
        <s-text color="subdued">{`Showing ${data.windowLabel}`}</s-text>
        <s-box inlineSize="180px">
          <Select
            ref={rangeRef}
            label="Date range"
            isLabelHidden
            value={String(range)}
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ]}
          />
        </s-box>
      </s-stack>

      <div className="pk-grid pk-grid--4">
        <MetricCard
          label="Orders called"
          value={formatNumber(kpis.ordersCalled)}
          change={percentChange(kpis.ordersCalled, previousKpis.ordersCalled)}
          hint={`${formatNumber(previousKpis.ordersCalled)} in ${previousLabel}`}
        />
        <MetricCard
          label="Answer rate"
          value={formatPercent(kpis.answerRate)}
          change={pointsChange(kpis.answerRate, previousKpis.answerRate)}
          changeUnit=" pts"
          hint={`${formatPercent(previousKpis.answerRate)} in ${previousLabel}`}
        />
        <MetricCard
          label="Confirmation rate"
          value={formatPercent(kpis.confirmationRate)}
          change={pointsChange(
            kpis.confirmationRate,
            previousKpis.confirmationRate,
          )}
          changeUnit=" pts"
          hint={`${formatPercent(previousKpis.confirmationRate)} in ${previousLabel}`}
        />
        <MetricCard
          label="Fake COD value stopped"
          value={formatMoney(kpis.codValueProtected, currency)}
          // No up/down badge: fewer fake orders isn't "bad", so a red arrow would mislead.
          change={null}
          hint={`${formatMoney(previousKpis.codValueProtected, currency)} in ${previousLabel}`}
        />
      </div>

      <OutcomeFunnel
        funnel={data.funnel}
        skips={data.skips}
        windowLabel={data.windowLabel}
      />

      {/* Equal-height pair: both cards stretch to the taller one. */}
      <div className="pk-columns pk-columns--equal">
        <div className="pk-card">
          <div className="pk-cardhead">
            <s-heading>Daily results</s-heading>
          </div>
          <StackedBarChart
            description={`Confirmed, cancelled, and unreachable calls per day, ${data.windowLabel}`}
            series={[
              {
                key: "confirmed",
                label: "Confirmed",
                color: CHART_COLORS.success,
              },
              {
                key: "cancelled",
                label: "Cancelled",
                color: CHART_COLORS.critical,
              },
              {
                key: "unreachable",
                label: "Unreachable",
                color: CHART_COLORS.neutral,
              },
            ]}
            data={data.trend.map((point) => ({
              label: formatDayKey(point.day),
              values: {
                confirmed: point.confirmed,
                cancelled: point.cancelled,
                unreachable: point.unreachable,
              },
            }))}
          />
        </div>
        <AddressQualityCard counts={data.addressQuality} />
      </div>
    </AppPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
