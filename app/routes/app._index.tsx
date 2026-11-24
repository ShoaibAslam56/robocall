import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { listCalls, listFlows } from "../data/robocall.server";
import { CallsTable } from "../components/CallsTable";
import { computeCallStats } from "../utils/stats";
import { TRIGGER_LABELS, formatDuration } from "../utils/format";

const RECENT_CALLS_LIMIT = 5;

// Loaders run on the server before the page renders. The component gets
// whatever this returns via useLoaderData(). For now that's mock JSON.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const [allCalls, flows] = await Promise.all([listCalls(), listFlows()]);

  return {
    stats: computeCallStats(allCalls),
    recentCalls: allCalls.slice(0, RECENT_CALLS_LIMIT),
    flows,
  };
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <s-box padding="base" background="base" borderRadius="base" border="base">
      <s-stack direction="block" gap="small-200">
        <s-text color="subdued">{label}</s-text>
        <s-heading>{value}</s-heading>
        {hint ? <s-text color="subdued">{hint}</s-text> : null}
      </s-stack>
    </s-box>
  );
}

export default function Dashboard() {
  const { stats, recentCalls, flows } = useLoaderData<typeof loader>();
  const activeFlows = flows.filter((f) => f.enabled);

  return (
    <s-page heading="Dashboard">
      <s-button slot="primary-action" href="/app/flows">
        Manage call flows
      </s-button>

      <s-banner tone="info" heading="Demo mode">
        You&apos;re seeing sample data. Calls aren&apos;t placed until the
        backend is connected.
      </s-banner>

      <s-section heading="Overview">
        <s-grid
          gridTemplateColumns="@container (inline-size > 600px) 1fr 1fr 1fr 1fr, 1fr 1fr"
          gap="base"
        >
          <StatCard label="Calls made" value={String(stats.totalCalls)} />
          <StatCard
            label="Confirmation rate"
            value={`${stats.confirmationRate}%`}
            hint={`${stats.confirmed} confirmed`}
          />
          <StatCard
            label="Cancelled"
            value={String(stats.cancelled)}
            hint={`${stats.failedOrNoAnswer} failed / no answer`}
          />
          <StatCard
            label="Avg. call length"
            value={formatDuration(stats.averageDurationSeconds)}
          />
        </s-grid>
      </s-section>

      <s-section heading="Recent calls">
        <CallsTable calls={recentCalls} flows={flows} />
        <s-link href="/app/calls">View all calls</s-link>
      </s-section>

      <s-section slot="aside" heading="Active flows">
        {activeFlows.length === 0 ? (
          <s-paragraph>No flows are turned on.</s-paragraph>
        ) : (
          <s-unordered-list>
            {activeFlows.map((flow) => (
              <s-list-item key={flow.id}>
                {flow.name} · {TRIGGER_LABELS[flow.trigger]}
              </s-list-item>
            ))}
          </s-unordered-list>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
