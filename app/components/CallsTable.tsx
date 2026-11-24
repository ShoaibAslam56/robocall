import type { CallFlow, CallRecord } from "../types/robocall";
import {
  STATUS_DISPLAY,
  formatDateTime,
  formatDuration,
  formatMoney,
} from "../utils/format";

interface CallsTableProps {
  calls: readonly CallRecord[];
  flows: readonly CallFlow[];
}

export function CallsTable({ calls, flows }: CallsTableProps) {
  if (calls.length === 0) {
    return <s-paragraph>No calls match this filter yet.</s-paragraph>;
  }

  const flowNameById = new Map(flows.map((f) => [f.id, f.name]));

  return (
    <s-table>
      <s-table-header-row>
        <s-table-header listSlot="primary">Order</s-table-header>
        <s-table-header listSlot="secondary">Customer</s-table-header>
        <s-table-header>Flow</s-table-header>
        <s-table-header listSlot="inline">Status</s-table-header>
        <s-table-header format="numeric">Total</s-table-header>
        <s-table-header format="numeric">Duration</s-table-header>
        <s-table-header format="numeric">Attempts</s-table-header>
        <s-table-header>Time</s-table-header>
      </s-table-header-row>
      <s-table-body>
        {calls.map((call) => {
          const status = STATUS_DISPLAY[call.status];
          return (
            <s-table-row key={call.id}>
              <s-table-cell>{call.orderName}</s-table-cell>
              <s-table-cell>
                <s-stack direction="block">
                  <s-text>{call.customerName}</s-text>
                  <s-text color="subdued">{call.phone}</s-text>
                </s-stack>
              </s-table-cell>
              <s-table-cell>
                {flowNameById.get(call.flowId) ?? call.flowId}
              </s-table-cell>
              <s-table-cell>
                <s-badge tone={status.tone}>{status.label}</s-badge>
              </s-table-cell>
              <s-table-cell>
                {formatMoney(call.orderTotal, call.currency)}
              </s-table-cell>
              <s-table-cell>{formatDuration(call.durationSeconds)}</s-table-cell>
              <s-table-cell>{call.attempts}</s-table-cell>
              <s-table-cell>{formatDateTime(call.startedAt)}</s-table-cell>
            </s-table-row>
          );
        })}
      </s-table-body>
    </s-table>
  );
}
