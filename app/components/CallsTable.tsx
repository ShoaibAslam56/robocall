import type { CallRecord } from "../types/robocall";
import {
  EVENT_LABELS,
  STATUS_DISPLAY,
  formatDateTime,
  formatMoney,
} from "../utils/format";

interface CallsTableContentProps {
  calls: readonly CallRecord[];
  timeZone: string;
}

// Only the header row and body. The page owns the <s-table> itself, so it
// can add filters, pagination, and loading state around these rows.
export function CallsTableContent({ calls, timeZone }: CallsTableContentProps) {
  return (
    <>
      <s-table-header-row>
        <s-table-header listSlot="primary">Order</s-table-header>
        <s-table-header listSlot="secondary">Customer</s-table-header>
        <s-table-header>City</s-table-header>
        <s-table-header format="currency">Total</s-table-header>
        <s-table-header>Trigger</s-table-header>
        <s-table-header listSlot="inline">Result</s-table-header>
        <s-table-header format="numeric">Attempts</s-table-header>
        <s-table-header>Order time</s-table-header>
      </s-table-header-row>
      <s-table-body>
        {calls.map((call) => (
          <CallRow key={call.id} call={call} timeZone={timeZone} />
        ))}
      </s-table-body>
    </>
  );
}

function CallRow({ call, timeZone }: { call: CallRecord; timeZone: string }) {
  const status = STATUS_DISPLAY[call.status];
  return (
    <s-table-row>
      <s-table-cell>
        <s-link href={`/app/calls/${call.id}`}>{call.orderName}</s-link>
      </s-table-cell>
      <s-table-cell>
        <s-stack direction="block">
          <s-text>{call.customerName}</s-text>
          <s-text color="subdued">{call.phone}</s-text>
        </s-stack>
      </s-table-cell>
      <s-table-cell>{call.city}</s-table-cell>
      <s-table-cell>
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-text>{formatMoney(call.orderTotal, call.currency)}</s-text>
          {call.paymentMethod === "cod" ? <s-badge>COD</s-badge> : null}
        </s-stack>
      </s-table-cell>
      <s-table-cell>{EVENT_LABELS[call.event]}</s-table-cell>
      <s-table-cell>
        <s-badge tone={status.tone}>{status.label}</s-badge>
      </s-table-cell>
      <s-table-cell>{call.attempts.length}</s-table-cell>
      <s-table-cell>
        {formatDateTime(call.orderCreatedAt, timeZone)}
      </s-table-cell>
    </s-table-row>
  );
}
