import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings, listVoices } from "../data/robocall.server";
import { SettingsForm } from "../components/SettingsForm";
import { SettingsSection } from "../components/SettingsSection";
import { FieldRow } from "../components/FieldRow";
import { Select } from "../components/Select";
import { readChecked, useDomEvent } from "../hooks/useDomEvent";
import type { Settings } from "../types/robocall";
import { EVENT_LABELS, formatDelay } from "../utils/format";

const DELAY_OPTIONS = [0, 2, 5, 15, 30, 60, 120, 360, 1440] as const;
const AUTO_CANCEL_HOURS = [6, 12, 24, 48, 72] as const;

const EVENT_HINTS: Record<string, string> = {
  order_placed: "Confirm COD orders before you pack them.",
  order_fulfilled: "Let customers know the order is packed.",
  out_for_delivery: "Ask customers to keep cash ready.",
  delivered: "Ask how the delivery went (press 1 happy, 2 unhappy).",
  delivery_failed: "Reschedule before the parcel is returned.",
  order_cancelled: "Confirm the cancellation with the customer.",
};

const TAG_FIELDS: ReadonlyArray<{
  key: keyof Settings["automation"]["tags"];
  label: string;
}> = [
  { key: "confirmed", label: "Confirmed (pressed 1)" },
  { key: "cancelled", label: "Cancelled (pressed 2)" },
  { key: "callback", label: "Call-back (pressed 3)" },
  { key: "pending", label: "No answer yet" },
  { key: "feedbackPositive", label: "Happy with delivery" },
  { key: "feedbackNegative", label: "Unhappy with delivery" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [settings, voices] = await Promise.all([getSettings(), listVoices()]);
  return { automation: settings.automation, voices };
};

export default function AutomationSettings() {
  const { automation, voices } = useLoaderData<typeof loader>();
  const [isAutoCancelOn, setIsAutoCancelOn] = useState(
    automation.autoCancel.enabled,
  );
  const autoCancelRef = useDomEvent("change", (e) =>
    setIsAutoCancelOn(readChecked(e)),
  );

  return (
    <SettingsForm>
      <SettingsSection
        title="Call triggers"
        description="Shopify events that start a call. Each one can use its own recording and delay."
      >
        <s-stack direction="block" gap="small">
          {automation.events.map((rule, index) => (
            <s-stack key={rule.event} direction="block" gap="small">
              {index > 0 ? <s-divider /> : null}
              <s-checkbox
                name={`event-${rule.event}-enabled`}
                label={EVENT_LABELS[rule.event]}
                details={EVENT_HINTS[rule.event]}
                checked={rule.enabled || undefined}
              />
              <FieldRow>
                <Select
                  name={`event-${rule.event}-voice`}
                  label="Recording"
                  value={rule.voiceId}
                  options={voices.map((v) => ({
                    value: v.id,
                    label: v.name,
                  }))}
                />
                <Select
                  name={`event-${rule.event}-delay`}
                  label="When"
                  value={String(rule.delayMinutes)}
                  options={DELAY_OPTIONS.map((m) => ({
                    value: String(m),
                    label: formatDelay(m),
                  }))}
                />
              </FieldRow>
            </s-stack>
          ))}
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Which orders get a call"
        description="Skip orders that don't need confirming. Skipped orders show as “Filtered” in Call logs."
      >
        <s-stack direction="block" gap="small">
          <s-checkbox
            name="codOnly"
            label="Only cash-on-delivery orders"
            checked={automation.codOnly || undefined}
          />
          <s-checkbox
            name="webOrdersOnly"
            label="Only online store orders"
            details="Skips draft orders and point-of-sale orders."
            checked={automation.webOrdersOnly || undefined}
          />
          <s-money-field
            name="minCodAmount"
            label="Minimum order total (PKR)"
            details="Small orders below this amount are not called. 0 calls every order."
            value={String(automation.minCodAmount)}
            min={0}
          />
          <s-text-field
            name="excludedCities"
            label="Skip these cities"
            placeholder="e.g. Quetta, Gilgit"
            details="Separate cities with commas."
            value={automation.excludedCities.join(", ")}
          />
          <s-text-field
            name="excludedTags"
            label="Skip orders with these tags"
            placeholder="e.g. wholesale, staff"
            details="Separate tags with commas."
            value={automation.excludedTags.join(", ")}
          />
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Unconfirmed orders"
        description="Orders where the customer never pressed 1, even after all retries."
      >
        <s-stack direction="block" gap="small">
          <s-switch
            ref={autoCancelRef}
            name="autoCancelEnabled"
            label="Cancel unconfirmed orders automatically"
            checked={automation.autoCancel.enabled || undefined}
          />
          {isAutoCancelOn ? (
            <>
              <Select
                name="autoCancelAfterHours"
                label="Cancel after"
                value={String(automation.autoCancel.afterHours)}
                options={AUTO_CANCEL_HOURS.map((h) => ({
                  value: String(h),
                  label: `${h} hours without confirmation`,
                }))}
              />
              <s-choice-list
                name="cancelInShopify"
                label="What to do in Shopify"
              >
                <s-choice
                  value="tag"
                  selected={!automation.autoCancel.cancelInShopify || undefined}
                >
                  Only add the cancelled tag
                  <s-text slot="details">
                    Safer. You review and cancel the order yourself.
                  </s-text>
                </s-choice>
                <s-choice
                  value="cancel"
                  selected={automation.autoCancel.cancelInShopify || undefined}
                >
                  Cancel the order in Shopify
                  <s-text slot="details">
                    Restocks items automatically. This can&apos;t be undone.
                  </s-text>
                </s-choice>
              </s-choice-list>
            </>
          ) : null}
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Order tags"
        description="Tags we add to Shopify orders after each call, so you can filter orders and build courier workflows."
      >
        <s-query-container>
          <s-grid
            gridTemplateColumns="@container (inline-size > 480px) 1fr 1fr, 1fr"
            gap="small"
          >
            {TAG_FIELDS.map((field) => (
              <s-text-field
                key={field.key}
                name={`tag-${field.key}`}
                label={field.label}
                value={automation.tags[field.key]}
              />
            ))}
          </s-grid>
        </s-query-container>
      </SettingsSection>
    </SettingsForm>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
