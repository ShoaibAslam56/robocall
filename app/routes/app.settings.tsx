import type { FormEvent } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings } from "../data/robocall.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { settings: await getSettings() };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  // `data-save-bar` makes App Bridge show Shopify's own Save/Discard bar
  // when a field changes. There's no backend yet, so Save just shows a
  // toast. Later this becomes a React Router `action` that saves the data.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    shopify.toast.show("Demo mode: settings aren't saved yet");
  };

  return (
    <s-page heading="Settings">
      <form data-save-bar onSubmit={handleSubmit}>
        <s-section heading="Caller">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Caller name"
              name="callerName"
              details="What the robot says your store is called"
              defaultValue={settings.callerName}
            />
            <s-select label="Voice" name="voice" value={settings.voice}>
              <s-option value="female-1">Female voice 1</s-option>
              <s-option value="female-2">Female voice 2</s-option>
              <s-option value="male-1">Male voice 1</s-option>
              <s-option value="male-2">Male voice 2</s-option>
            </s-select>
            <s-select
              label="Language"
              name="language"
              value={settings.language}
            >
              <s-option value="en">English</s-option>
              <s-option value="ur">Urdu</s-option>
              <s-option value="ar">Arabic</s-option>
              <s-option value="es">Spanish</s-option>
            </s-select>
          </s-stack>
        </s-section>

        <s-section heading="Calling hours">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Calls are only placed inside this window, in the time zone
              below. Many countries restrict automated calls outside normal
              hours.
            </s-paragraph>
            <s-text-field
              label="Time zone"
              name="timezone"
              defaultValue={settings.timezone}
            />
            <s-stack direction="inline" gap="base">
              <s-text-field
                label="Start (HH:MM)"
                name="callingHoursStart"
                defaultValue={settings.callingHoursStart}
              />
              <s-text-field
                label="End (HH:MM)"
                name="callingHoursEnd"
                defaultValue={settings.callingHoursEnd}
              />
            </s-stack>
          </s-stack>
        </s-section>

        <s-section heading="Retries">
          <s-stack direction="inline" gap="base">
            <s-number-field
              label="Max attempts per order"
              name="maxAttemptsPerOrder"
              min={1}
              max={5}
              defaultValue={String(settings.maxAttemptsPerOrder)}
            />
            <s-number-field
              label="Minutes between retries"
              name="retryDelayMinutes"
              min={5}
              defaultValue={String(settings.retryDelayMinutes)}
            />
          </s-stack>
        </s-section>

        <s-section heading="Consent">
          <s-switch
            label="Only call customers who opted in to calls"
            name="requireConsent"
            details="Strongly recommended. Calling without consent can break laws like the TCPA."
            defaultChecked={settings.requireConsent}
          />
        </s-section>
      </form>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
