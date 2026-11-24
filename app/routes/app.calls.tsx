import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { listCalls, listFlows } from "../data/robocall.server";
import { CallsTable } from "../components/CallsTable";
import { CALL_STATUSES, type CallStatus } from "../types/robocall";
import { STATUS_DISPLAY } from "../utils/format";

// The filter lives in the URL (?status=failed), not in React state.
// That way a refresh or a shared link shows the same filtered list.
// URL params are user input, so we check the value before trusting it.
export function parseStatusParam(value: string | null): CallStatus | undefined {
  return CALL_STATUSES.find((s) => s === value);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const status = parseStatusParam(url.searchParams.get("status"));

  const [calls, flows] = await Promise.all([
    listCalls({ status }),
    listFlows(),
  ]);

  return { calls, flows, status: status ?? null };
};

export default function CallLogs() {
  const { calls, flows, status } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const selectStatus = (next: CallStatus | null) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next) {
        params.set("status", next);
      } else {
        params.delete("status");
      }
      return params;
    });
  };

  return (
    <s-page heading="Call logs">
      <s-section>
        <s-stack direction="block" gap="base">
          <s-button-group>
            <s-button
              slot="secondary-actions"
              variant={status === null ? "primary" : "secondary"}
              onClick={() => selectStatus(null)}
            >
              All
            </s-button>
            {CALL_STATUSES.map((s) => (
              <s-button
                key={s}
                slot="secondary-actions"
                variant={status === s ? "primary" : "secondary"}
                onClick={() => selectStatus(s)}
              >
                {STATUS_DISPLAY[s].label}
              </s-button>
            ))}
          </s-button-group>
          <CallsTable calls={calls} flows={flows} />
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
