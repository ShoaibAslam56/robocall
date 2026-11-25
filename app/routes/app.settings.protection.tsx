import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings } from "../data/robocall.server";
import { SettingsForm } from "../components/SettingsForm";
import { SettingsSection } from "../components/SettingsSection";
import { FieldRow } from "../components/FieldRow";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { protection: (await getSettings()).protection };
};

export default function ProtectionSettings() {
  const { protection } = useLoaderData<typeof loader>();
  const { addressValidator, duplicates, invalidNumbers } = protection;

  return (
    <SettingsForm>
      <SettingsSection
        title="AI address check"
        description="Scores every delivery address from 0 to 100 and tags the order, so you can fix bad addresses before the courier leaves."
      >
        <s-stack direction="block" gap="small">
          <s-switch
            name="addressEnabled"
            label="Check delivery addresses"
            checked={addressValidator.enabled || undefined}
          />
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="block" gap="small-200">
              <s-stack direction="inline" gap="small" alignItems="center">
                <s-badge tone="critical">Incomplete</s-badge>
                <s-text>{`Below ${addressValidator.incompleteBelow}: missing house number, street, or area`}</s-text>
              </s-stack>
              <s-stack direction="inline" gap="small" alignItems="center">
                <s-badge tone="caution">Partial</s-badge>
                <s-text>{`${addressValidator.incompleteBelow}–${addressValidator.completeFrom - 1}: courier may need to call`}</s-text>
              </s-stack>
              <s-stack direction="inline" gap="small" alignItems="center">
                <s-badge tone="success">Complete</s-badge>
                <s-text>{`${addressValidator.completeFrom} and up: ready to ship`}</s-text>
              </s-stack>
            </s-stack>
          </s-box>
          <FieldRow>
            <s-number-field
              name="incompleteBelow"
              label="Incomplete below"
              value={String(addressValidator.incompleteBelow)}
              min={1}
              max={99}
            />
            <s-number-field
              name="completeFrom"
              label="Complete from"
              value={String(addressValidator.completeFrom)}
              min={2}
              max={100}
            />
          </FieldRow>
          <FieldRow>
            <s-text-field
              name="incompleteTag"
              label="Incomplete tag"
              value={addressValidator.incompleteTag}
            />
            <s-text-field
              name="partialTag"
              label="Partial tag"
              value={addressValidator.partialTag}
            />
          </FieldRow>
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Duplicate orders"
        description="Same phone, address, and total within a short time. Usually a customer pressing “Buy” twice."
      >
        <s-stack direction="block" gap="small">
          <s-switch
            name="duplicatesEnabled"
            label="Detect duplicate orders"
            checked={duplicates.enabled || undefined}
          />
          <s-number-field
            name="duplicateWindowMinutes"
            label="Count as duplicate if placed within"
            value={String(duplicates.windowMinutes)}
            suffix="minutes"
            min={5}
            max={1440}
          />
          <s-checkbox
            name="duplicateSkipCall"
            label="Don't call about duplicates"
            details="Saves call charges. The first order still gets its call."
            checked={duplicates.skipCall || undefined}
          />
          <s-text-field
            name="duplicateTag"
            label="Duplicate tag"
            value={duplicates.tag}
          />
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Invalid phone numbers"
        description="Numbers that can't be a Pakistani mobile, like too few digits or a wrong prefix."
      >
        <s-stack direction="block" gap="small">
          <s-switch
            name="invalidEnabled"
            label="Detect invalid numbers"
            checked={invalidNumbers.enabled || undefined}
          />
          <s-checkbox
            name="invalidSkipCall"
            label="Don't call invalid numbers"
            details="These calls would fail anyway."
            checked={invalidNumbers.skipCall || undefined}
          />
          <s-text-field
            name="invalidTag"
            label="Invalid number tag"
            value={invalidNumbers.tag}
          />
        </s-stack>
      </SettingsSection>
    </SettingsForm>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
