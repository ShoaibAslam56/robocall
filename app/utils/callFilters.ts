// Call-log filters live in the URL (?status=no_answer&q=ali&page=2).
// That way a refresh, the back button, or a shared link all show the same
// list, and the dashboard can deep-link into a pre-filtered log.
//
// URL params are user input, so every value is checked against the known
// list before we use it. Anything unknown is ignored.

import {
  CALL_EVENTS,
  CALL_STATUSES,
  CALL_TYPES,
  SKIP_REASONS,
  type AddressQuality,
  type CallEvent,
  type CallRecord,
  type CallStatus,
  type CallType,
  type SkipReason,
} from "../types/robocall";

const ADDRESS_QUALITIES = ["complete", "partial", "incomplete"] as const;
export const PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 100;

export interface CallFilters {
  status?: CallStatus;
  skip?: SkipReason;
  event?: CallEvent;
  type?: CallType;
  address?: AddressQuality;
  q?: string;
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string | null,
): T | undefined {
  return allowed.find((item) => item === value);
}

export function parseCallFilters(params: URLSearchParams): CallFilters {
  const q = params.get("q")?.trim().slice(0, MAX_QUERY_LENGTH);
  return {
    status: oneOf(CALL_STATUSES, params.get("status")),
    skip: oneOf(SKIP_REASONS, params.get("skip")),
    event: oneOf(CALL_EVENTS, params.get("event")),
    type: oneOf(CALL_TYPES, params.get("type")),
    address: oneOf(ADDRESS_QUALITIES, params.get("address")),
    q: q ? q : undefined,
  };
}

export function parsePage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

function matchesQuery(call: CallRecord, q: string): boolean {
  const needle = q.toLowerCase();
  const needleDigits = digitsOnly(q);
  return (
    call.orderName.toLowerCase().includes(needle) ||
    call.customerName.toLowerCase().includes(needle) ||
    call.city.toLowerCase().includes(needle) ||
    // "0300 123" and "+92 300 123" should both find the same number.
    (needleDigits.length >= 3 &&
      digitsOnly(call.phone).includes(needleDigits.replace(/^0/, "")))
  );
}

export function filterCalls(
  calls: readonly CallRecord[],
  filters: CallFilters,
): CallRecord[] {
  return calls.filter(
    (call) =>
      (!filters.status || call.status === filters.status) &&
      (!filters.skip || call.skipReason === filters.skip) &&
      (!filters.event || call.event === filters.event) &&
      (!filters.type || call.callType === filters.type) &&
      (!filters.address || call.addressQuality === filters.address) &&
      (!filters.q || matchesQuery(call, filters.q)),
  );
}

export function hasActiveFilters(filters: CallFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined);
}

export interface Page<T> {
  items: T[];
  page: number;
  totalItems: number;
  totalPages: number;
  firstItem: number; // 1-based, 0 when empty
  lastItem: number;
}

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = PAGE_SIZE,
): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    items: pageItems,
    page,
    totalItems: items.length,
    totalPages,
    firstItem: pageItems.length === 0 ? 0 : start + 1,
    lastItem: start + pageItems.length,
  };
}
