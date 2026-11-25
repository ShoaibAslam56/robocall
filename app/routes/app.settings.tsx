import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings } from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { SettingsTabs } from "../components/SettingsTabs";

// Layout route for /app/settings/*.
// React Router renders this for every settings URL and puts the active
// tab's page where <Outlet /> is. So the header, warning, and tabs are
// written once and shared by all four tabs.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { appEnabled: (await getSettings()).general.appEnabled };
};

export default function SettingsLayout() {
  const { appEnabled } = useLoaderData<typeof loader>();

  return (
    <AppPage heading="Settings">
      {appEnabled ? null : (
        <s-banner tone="warning" heading="Calling is off">
          New orders won&apos;t get a confirmation call. Turn calling on in the
          General tab.
        </s-banner>
      )}
      <SettingsTabs />
      <Outlet />
    </AppPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
