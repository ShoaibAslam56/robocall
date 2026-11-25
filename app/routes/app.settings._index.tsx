import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings } from "../data/robocall.server";
import { SettingsForm } from "../components/SettingsForm";
import { SettingsSection } from "../components/SettingsSection";
import { Select } from "../components/Select";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { general: (await getSettings()).general };
};

// React 18 note: for Polaris fields, `value` / `checked` / `selected` set the
// *starting* value (they map to HTML attributes). The field keeps its own
// state after that, which is exactly what a save-bar form needs.
// Booleans are passed as `x || undefined` because React 18 would turn
// `false` into the string "false", which still counts as "on".
export default function GeneralSettings() {
  const { general } = useLoaderData<typeof loader>();

  return (
    <SettingsForm>
      <SettingsSection
        title="Calling"
        description="Pause all calls without changing any other setting, for example during a holiday."
      >
        <s-switch
          name="appEnabled"
          label="Calling is on"
          details="When off, new orders are logged as “App was off” and not called."
          checked={general.appEnabled || undefined}
        />
      </SettingsSection>

      <SettingsSection
        title="Store name"
        description="Spoken by the default voices, e.g. “This is a call from Lorial PK”."
      >
        <s-text-field
          name="storeName"
          label="Store name in calls"
          value={general.storeName}
          maxLength={40}
        />
      </SettingsSection>

      <SettingsSection
        title="How calls start"
        description="Most stores use automatic calls. Manual is useful while you test the app."
      >
        <s-choice-list
          name="callMode"
          label="Call mode"
          labelAccessibilityVisibility="exclusive"
        >
          <s-choice
            value="auto"
            selected={general.callMode === "auto" || undefined}
          >
            Automatic
            <s-text slot="details">
              Every matching order gets a call within minutes.
            </s-text>
          </s-choice>
          <s-choice
            value="manual"
            selected={general.callMode === "manual" || undefined}
          >
            Manual
            <s-text slot="details">
              Orders wait in Call logs until you press “Call”.
            </s-text>
          </s-choice>
        </s-choice-list>
      </SettingsSection>

      <SettingsSection
        title="Time zone"
        description="Used for calling hours, break hours, and all dates in the app."
      >
        <Select
          name="timezone"
          label="Time zone"
          value={general.timezone}
          options={[{ value: "Asia/Karachi", label: "Pakistan (PKT, UTC+5)" }]}
        />
      </SettingsSection>
    </SettingsForm>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
