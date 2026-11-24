import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { listFlows } from "../data/robocall.server";
import { TRIGGER_LABELS } from "../utils/format";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { flows: await listFlows() };
};

export default function CallFlows() {
  const { flows } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Call flows">
      <s-paragraph>
        A flow decides <s-text type="strong">when</s-text> a customer gets a
        call and <s-text type="strong">what</s-text> the robot says. Words in{" "}
        <code>{"{{double_braces}}"}</code> are replaced with order details.
      </s-paragraph>

      {flows.map((flow) => (
        <s-section key={flow.id} heading={flow.name}>
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small-200">
              <s-badge tone={flow.enabled ? "success" : "neutral"}>
                {flow.enabled ? "On" : "Off"}
              </s-badge>
              <s-badge>Trigger: {TRIGGER_LABELS[flow.trigger]}</s-badge>
              <s-badge>
                Delay:{" "}
                {flow.delayMinutes === 0
                  ? "immediate"
                  : `${flow.delayMinutes} min`}
              </s-badge>
              <s-badge>Max attempts: {flow.maxAttempts}</s-badge>
            </s-stack>
            <s-box
              padding="base"
              background="subdued"
              borderRadius="base"
              border="base"
            >
              <s-paragraph>{flow.script}</s-paragraph>
            </s-box>
          </s-stack>
        </s-section>
      ))}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
