import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getShop, listCampaigns } from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import type { Campaign } from "../types/robocall";
import {
  AUDIENCE_SOURCE_LABELS,
  CAMPAIGN_STATUS_DISPLAY,
  formatDateTime,
  formatNumber,
} from "../utils/format";
import { percentOf } from "../utils/stats";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [shop, campaigns] = await Promise.all([getShop(), listCampaigns()]);
  return { campaigns, timeZone: shop.timezone };
};

export default function Campaigns() {
  const { campaigns, timeZone } = useLoaderData<typeof loader>();
  const totals = campaigns.reduce(
    (sum, c) => ({
      placed: sum.placed + c.stats.placed,
      answered: sum.answered + c.stats.answered,
      interested: sum.interested + c.stats.interested,
    }),
    { placed: 0, answered: 0, interested: 0 },
  );

  return (
    <AppPage
      heading="Campaigns"
      primaryAction={
        <s-button
          slot="primary-action"
          variant="primary"
          href="/app/campaigns/new"
        >
          Create campaign
        </s-button>
      }
    >
      <div className="pk-grid pk-grid--3">
        <MetricCard
          label="Campaign calls placed"
          value={formatNumber(totals.placed)}
          change={null}
          hint="All campaigns"
        />
        <MetricCard
          label="Answer rate"
          value={`${percentOf(totals.answered, totals.placed)}%`}
          change={null}
          hint={`${formatNumber(totals.answered)} people listened`}
        />
        <MetricCard
          label="Interested (pressed 1)"
          value={formatNumber(totals.interested)}
          change={null}
          hint={`${percentOf(totals.interested, totals.answered)}% of people who answered`}
        />
      </div>

      <s-section padding="none">
        {campaigns.length === 0 ? (
          <EmptyState
            icon="megaphone"
            heading="Call your customers about a sale or restock"
            action={
              <s-button variant="primary" href="/app/campaigns/new">
                Create campaign
              </s-button>
            }
          >
            Pick who to call, record a short message, and schedule it. People
            can press 1 if they&apos;re interested or 2 to stop future calls.
          </EmptyState>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Campaign</s-table-header>
              <s-table-header listSlot="inline">Status</s-table-header>
              <s-table-header format="numeric">Audience</s-table-header>
              <s-table-header>Progress</s-table-header>
              <s-table-header format="numeric">Answered</s-table-header>
              <s-table-header format="numeric">Interested</s-table-header>
              <s-table-header format="numeric">Opted out</s-table-header>
              <s-table-header listSlot="secondary">Send time</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {campaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  timeZone={timeZone}
                />
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-paragraph color="subdued">
        Only call customers who agreed to hear from you. Every campaign call
        lets people press 2 to stop future campaign calls, and we skip them
        automatically next time.
      </s-paragraph>
    </AppPage>
  );
}

function CampaignRow({
  campaign,
  timeZone,
}: {
  campaign: Campaign;
  timeZone: string;
}) {
  const status = CAMPAIGN_STATUS_DISPLAY[campaign.status];
  const { size } = campaign.audience;
  const { placed, answered, interested, optedOut } = campaign.stats;

  return (
    <s-table-row>
      <s-table-cell>
        <s-stack direction="block">
          <s-text type="strong">{campaign.name}</s-text>
          <s-text color="subdued">
            {`${AUDIENCE_SOURCE_LABELS[campaign.audience.source]} · ${campaign.audience.label}`}
          </s-text>
        </s-stack>
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={status.tone}>{status.label}</s-badge>
      </s-table-cell>
      <s-table-cell>{size > 0 ? formatNumber(size) : "—"}</s-table-cell>
      <s-table-cell>
        {campaign.status === "draft" || campaign.status === "scheduled"
          ? "Not started"
          : `${percentOf(placed, size)}% called`}
      </s-table-cell>
      <s-table-cell>
        {placed > 0
          ? `${formatNumber(answered)} (${percentOf(answered, placed)}%)`
          : "—"}
      </s-table-cell>
      <s-table-cell>
        {answered > 0 ? formatNumber(interested) : "—"}
      </s-table-cell>
      <s-table-cell>{answered > 0 ? formatNumber(optedOut) : "—"}</s-table-cell>
      <s-table-cell>
        {campaign.scheduledAt
          ? formatDateTime(campaign.scheduledAt, timeZone)
          : "Not scheduled"}
      </s-table-cell>
    </s-table-row>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
