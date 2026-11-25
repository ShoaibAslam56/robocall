import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getCall, getShop } from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { Columns } from "../components/Columns";
import { EmptyState } from "../components/EmptyState";
import { useDemoToast } from "../hooks/useDemoToast";
import type { CallRecord, Dtmf } from "../types/robocall";
import {
  ADDRESS_DISPLAY,
  ATTEMPT_RESULT_LABELS,
  EVENT_LABELS,
  SKIP_REASON_LABELS,
  STATUS_DISPLAY,
  formatDateTime,
  formatDuration,
  formatMoney,
} from "../utils/format";
import { totalTalkSeconds } from "../utils/stats";

const CALL_LOGS = { label: "Call logs", href: "/app/calls" };

const DTMF_MEANING: Record<Dtmf, string> = {
  "1": "Pressed 1: confirmed the order",
  "2": "Pressed 2: cancelled the order",
  "3": "Pressed 3: asked for a call-back",
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [shop, call] = await Promise.all([getShop(), getCall(params.id ?? "")]);
  return { call, timeZone: shop.timezone };
};

export default function CallDetail() {
  const { call, timeZone } = useLoaderData<typeof loader>();
  const showDemoToast = useDemoToast();

  if (!call) {
    return (
      <AppPage heading="Call not found" breadcrumb={CALL_LOGS}>
        <s-section>
          <EmptyState
            icon="search"
            heading="We couldn't find this call"
            action={<s-button href="/app/calls">Back to call logs</s-button>}
          >
            It may have been removed, or the link is wrong.
          </EmptyState>
        </s-section>
      </AppPage>
    );
  }

  const status = STATUS_DISPLAY[call.status];
  const address = ADDRESS_DISPLAY[call.addressQuality];
  const canCallAgain = call.skipReason !== "invalid_number";

  return (
    <AppPage
      heading={`Order ${call.orderName}`}
      breadcrumb={CALL_LOGS}
      primaryAction={
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={!canCallAgain || undefined}
          onClick={() => showDemoToast(`would call ${call.customerName} now`)}
        >
          Call again
        </s-button>
      }
      secondaryActions={
        <s-button
          slot="secondary-actions"
          href={`shopify://admin/orders/${call.orderId}`}
          target="_top"
        >
          View order in Shopify
        </s-button>
      }
    >
      <Columns
        main={
          <>
            <s-section heading="Result">
              <s-stack direction="block" gap="small">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-badge tone={status.tone}>{status.label}</s-badge>
                  <s-text>{describeOutcome(call)}</s-text>
                </s-stack>
                {call.tags.length > 0 ? (
                  <s-stack
                    direction="inline"
                    gap="small-200"
                    alignItems="center"
                  >
                    <s-text color="subdued">Tags added to the order:</s-text>
                    {call.tags.map((tag) => (
                      <s-badge key={tag}>{tag}</s-badge>
                    ))}
                  </s-stack>
                ) : null}
              </s-stack>
            </s-section>

            <s-section heading="Call attempts">
              {call.attempts.length === 0 ? (
                <s-text color="subdued">
                  No calls were placed for this order.
                </s-text>
              ) : (
                <s-stack direction="block" gap="small">
                  {call.attempts.map((attempt, index) => (
                    <s-stack key={attempt.at} direction="block" gap="small">
                      {index > 0 ? <s-divider /> : null}
                      <s-stack
                        direction="inline"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <s-stack
                          direction="inline"
                          gap="small"
                          alignItems="center"
                        >
                          <s-icon
                            type={
                              attempt.result === "answered"
                                ? "phone-in"
                                : "phone-out"
                            }
                            tone={
                              attempt.result === "answered"
                                ? "success"
                                : "neutral"
                            }
                          />
                          <s-stack direction="block">
                            <s-text type="strong">
                              {index === 0 ? "First call" : `Retry ${index}`}
                            </s-text>
                            <s-text color="subdued">
                              {formatDateTime(attempt.at, timeZone)}
                            </s-text>
                          </s-stack>
                        </s-stack>
                        <s-stack
                          direction="inline"
                          gap="small"
                          alignItems="center"
                        >
                          <s-text color="subdued">
                            {formatDuration(attempt.durationSeconds)}
                          </s-text>
                          <s-badge
                            tone={
                              attempt.result === "answered"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {ATTEMPT_RESULT_LABELS[attempt.result]}
                          </s-badge>
                        </s-stack>
                      </s-stack>
                    </s-stack>
                  ))}
                  <s-divider />
                  <s-text color="subdued">
                    {`Total talk time: ${formatDuration(totalTalkSeconds(call))}`}
                  </s-text>
                </s-stack>
              )}
            </s-section>
          </>
        }
        aside={
          <>
            <s-section heading="Customer">
              <s-stack direction="block" gap="small-200">
                <s-text type="strong">{call.customerName}</s-text>
                <s-text>{call.phone}</s-text>
                <s-text color="subdued">{call.city}</s-text>
              </s-stack>
            </s-section>

            <s-section heading="Order">
              <s-stack direction="block" gap="small">
                <DetailRow
                  label="Total"
                  value={formatMoney(call.orderTotal, call.currency)}
                />
                <DetailRow
                  label="Payment"
                  value={
                    call.paymentMethod === "cod"
                      ? "Cash on delivery"
                      : "Prepaid"
                  }
                />
                <DetailRow
                  label="Placed"
                  value={formatDateTime(call.orderCreatedAt, timeZone)}
                />
                <DetailRow
                  label="Call trigger"
                  value={EVENT_LABELS[call.event]}
                />
              </s-stack>
            </s-section>

            <s-section heading="Address check">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-badge tone={address.tone}>{address.label}</s-badge>
                  <s-text color="subdued">{`Score ${call.addressScore} / 100`}</s-text>
                </s-stack>
                {call.addressQuality !== "complete" ? (
                  <s-text color="subdued">
                    Ask the customer for a house number, street, or landmark
                    before dispatch.
                  </s-text>
                ) : null}
              </s-stack>
            </s-section>
          </>
        }
      />
    </AppPage>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <s-stack direction="inline" justifyContent="space-between" gap="small">
      <s-text color="subdued">{label}</s-text>
      <s-text>{value}</s-text>
    </s-stack>
  );
}

function describeOutcome(call: CallRecord): string {
  if (call.dtmf) return DTMF_MEANING[call.dtmf];
  if (call.skipReason)
    return `Not called: ${SKIP_REASON_LABELS[call.skipReason]}.`;
  switch (call.status) {
    case "no_answer":
      return `No answer after ${call.attempts.length} attempts.`;
    case "failed":
      return "The call couldn't connect.";
    case "pending":
      return "Waiting for the next call attempt.";
    default:
      return "";
  }
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
