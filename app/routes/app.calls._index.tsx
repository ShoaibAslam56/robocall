import { useEffect, useRef } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getShop, listCalls } from "../data/robocall.server";
import { AppPage } from "../components/AppPage";
import { CallsTableContent } from "../components/CallsTable";
import { EmptyState } from "../components/EmptyState";
import { Select } from "../components/Select";
import { readValue, useDomEvent } from "../hooks/useDomEvent";
import {
  CALL_EVENTS,
  CALL_STATUSES,
  CALL_TYPES,
  type CallRecord,
} from "../types/robocall";
import {
  hasActiveFilters,
  paginate,
  parseCallFilters,
  parsePage,
} from "../utils/callFilters";
import { downloadCsv, toCsv } from "../utils/csv";
import {
  ADDRESS_DISPLAY,
  CALL_TYPE_LABELS,
  EVENT_LABELS,
  SKIP_REASON_LABELS,
  STATUS_DISPLAY,
  formatDateTime,
  formatNumber,
} from "../utils/format";

const SEARCH_DEBOUNCE_MS = 300;

// "all" = no filter. (An empty "" value makes Polaris report the option's
// label as its value.) Built once at module load, not on every render.
const ALL = "all";
const STATUS_OPTIONS = [
  { value: ALL, label: "All results" },
  ...CALL_STATUSES.map((s) => ({ value: s, label: STATUS_DISPLAY[s].label })),
];
const EVENT_OPTIONS = [
  { value: ALL, label: "All triggers" },
  ...CALL_EVENTS.map((e) => ({ value: e, label: EVENT_LABELS[e] })),
];
const TYPE_OPTIONS = [
  { value: ALL, label: "Auto & manual" },
  ...CALL_TYPES.map((t) => ({ value: t, label: CALL_TYPE_LABELS[t] })),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const params = new URL(request.url).searchParams;
  const filters = parseCallFilters(params);
  const [shop, calls] = await Promise.all([getShop(), listCalls(filters)]);

  // With mock data the whole filtered list is small, so we send it all and
  // let the page slice it (and export it). With a real API, the server
  // would return one page at a time and export would be its own endpoint.
  return { calls, filters, page: parsePage(params), timeZone: shop.timezone };
};

export default function CallLogs() {
  const { calls, filters, page, timeZone } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const current = paginate(calls, page);

  // Changing any filter resets to page 1, otherwise you could land on
  // "page 5" of a list that now only has 2 pages.
  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== ALL) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  const statusRef = useDomEvent("change", (e) =>
    setParam("status", readValue(e)),
  );
  const eventRef = useDomEvent("change", (e) =>
    setParam("event", readValue(e)),
  );
  const typeRef = useDomEvent("change", (e) => setParam("type", readValue(e)));

  // Search as you type, but wait until typing pauses so we don't reload on
  // every keystroke.
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const searchRef = useDomEvent("input", (e) => {
    const value = readValue(e);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => setParam("q", value.trim()),
      SEARCH_DEBOUNCE_MS,
    );
  });

  const tableRef = useDomEvent("nextpage", () =>
    setParam("page", String(current.page + 1)),
  );
  const prevRef = useDomEvent("previouspage", () =>
    setParam("page", String(current.page - 1)),
  );
  // One element, two events: combine both callback refs.
  const setTableRef = (el: HTMLElement | null) => {
    tableRef(el);
    prevRef(el);
  };

  const exportCsv = () =>
    downloadCsv(`call-logs-${Date.now()}.csv`, buildCsv(calls, timeZone));
  const extraFilter = filters.skip
    ? `Not called: ${SKIP_REASON_LABELS[filters.skip]}`
    : filters.address
      ? `Address: ${ADDRESS_DISPLAY[filters.address].label}`
      : null;

  return (
    <AppPage
      heading="Call logs"
      secondaryActions={
        <s-button
          slot="secondary-actions"
          icon="export"
          onClick={exportCsv}
          disabled={calls.length === 0 || undefined}
        >
          Export CSV
        </s-button>
      }
    >
      <s-section>
        <s-table
          ref={setTableRef}
          paginate
          hasNextPage={current.page < current.totalPages || undefined}
          hasPreviousPage={current.page > 1 || undefined}
          loading={navigation.state === "loading" || undefined}
        >
          <s-stack slot="filters" direction="block" gap="small">
            <s-query-container>
              <s-grid
                gridTemplateColumns="@container (inline-size > 720px) 2fr 1fr 1fr 1fr, 1fr"
                gap="small"
              >
                <s-search-field
                  ref={searchRef}
                  label="Search calls"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="Search order, name, phone, or city"
                  value={filters.q ?? ""}
                />
                <Select
                  ref={statusRef}
                  label="Result"
                  isLabelHidden
                  value={filters.status ?? ALL}
                  options={STATUS_OPTIONS}
                />
                <Select
                  ref={eventRef}
                  label="Trigger"
                  isLabelHidden
                  value={filters.event ?? ALL}
                  options={EVENT_OPTIONS}
                />
                <Select
                  ref={typeRef}
                  label="Call type"
                  isLabelHidden
                  value={filters.type ?? ALL}
                  options={TYPE_OPTIONS}
                />
              </s-grid>
            </s-query-container>
            {hasActiveFilters(filters) ? (
              <s-stack direction="inline" gap="small" alignItems="center">
                {extraFilter ? <s-badge>{extraFilter}</s-badge> : null}
                <s-text color="subdued">
                  {`${formatNumber(current.totalItems)} matching ${current.totalItems === 1 ? "call" : "calls"}`}
                </s-text>
                <s-button variant="tertiary" href="/app/calls">
                  Clear filters
                </s-button>
              </s-stack>
            ) : null}
          </s-stack>

          {current.items.length > 0 ? (
            <CallsTableContent calls={current.items} timeZone={timeZone} />
          ) : null}
        </s-table>

        {current.items.length === 0 ? (
          <EmptyState icon="search" heading="No calls match these filters">
            Try a different search or clear the filters to see every call.
          </EmptyState>
        ) : (
          <s-box paddingBlockStart="small">
            <s-text color="subdued">
              {`Showing ${current.firstItem}–${current.lastItem} of ${formatNumber(current.totalItems)}`}
              {searchParams.get("page")
                ? ` · page ${current.page} of ${current.totalPages}`
                : ""}
            </s-text>
          </s-box>
        )}
      </s-section>
    </AppPage>
  );
}

function buildCsv(calls: readonly CallRecord[], timeZone: string): string {
  const header = [
    "Order",
    "Customer",
    "Phone",
    "City",
    "Payment",
    "Total (PKR)",
    "Trigger",
    "Result",
    "Key pressed",
    "Not called because",
    "Attempts",
    "Address",
    "Order time",
    "Tags",
  ];
  const rows = calls.map((c) => [
    c.orderName,
    c.customerName,
    c.phone,
    c.city,
    c.paymentMethod.toUpperCase(),
    c.orderTotal,
    EVENT_LABELS[c.event],
    STATUS_DISPLAY[c.status].label,
    c.dtmf,
    c.skipReason ? SKIP_REASON_LABELS[c.skipReason] : null,
    c.attempts.length,
    ADDRESS_DISPLAY[c.addressQuality].label,
    formatDateTime(c.orderCreatedAt, timeZone),
    c.tags.join(" "),
  ]);
  return toCsv([header, ...rows]);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
