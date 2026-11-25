// Pure metric functions for the dashboard: same input → same output,
// no side effects. Easy to unit test, and they can run on server or client.

import type {
  AddressQuality,
  CallRecord,
  Kpis,
  SkipReason,
} from "../types/robocall";
import { SKIP_REASONS } from "../types/robocall";
import { listDays, toDayKey, type DateWindow } from "./dates";

type Calls = readonly CallRecord[];

/** Whole-number percentage. Returns 0 (not NaN) when `whole` is 0. */
export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** % change from previous to current. null when there's nothing to compare. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const wasCalled = (c: CallRecord): boolean => c.attempts.length > 0;
const wasAnswered = (c: CallRecord): boolean =>
  c.attempts.some((a) => a.result === "answered");
const countWhere = (calls: Calls, test: (c: CallRecord) => boolean): number =>
  calls.filter(test).length;

export function computeKpis(calls: Calls): Kpis {
  const called = countWhere(calls, wasCalled);
  const answered = countWhere(calls, wasAnswered);
  const confirmed = countWhere(calls, (c) => c.status === "confirmed");
  const codValueProtected = calls
    .filter((c) => c.status === "cancelled" && c.paymentMethod === "cod")
    .reduce((sum, c) => sum + c.orderTotal, 0);

  return {
    ordersCalled: called,
    answerRate: called === 0 ? null : percentOf(answered, called),
    confirmationRate: answered === 0 ? null : percentOf(confirmed, answered),
    codValueProtected,
  };
}

export interface Funnel {
  received: number;
  notCalled: number; // skipped before any call (duplicate, invalid number, …)
  placed: number;
  answered: number;
  outcomes: {
    confirmed: number;
    cancelled: number;
    callback: number;
    unreachable: number; // no answer after all retries, or call failed
    inProgress: number;
  };
}

export function computeFunnel(calls: Calls): Funnel {
  const byStatus = (s: CallRecord["status"]) =>
    countWhere(calls, (c) => c.status === s);

  return {
    received: calls.length,
    // Counted directly from the status. Deriving it as received − placed −
    // pending double-subtracts pending orders that already had an attempt.
    notCalled: byStatus("not_initiated"),
    placed: countWhere(calls, wasCalled),
    answered: countWhere(calls, wasAnswered),
    outcomes: {
      confirmed: byStatus("confirmed"),
      cancelled: byStatus("cancelled"),
      callback: byStatus("callback"),
      unreachable: byStatus("no_answer") + byStatus("failed"),
      inProgress: byStatus("pending"),
    },
  };
}

export function countSkipReasons(calls: Calls): Record<SkipReason, number> {
  return Object.fromEntries(
    SKIP_REASONS.map((reason) => [
      reason,
      countWhere(calls, (c) => c.skipReason === reason),
    ]),
  ) as Record<SkipReason, number>;
}

export interface TrendPoint {
  day: string;
  confirmed: number;
  cancelled: number;
  unreachable: number;
}

export function computeDailyTrend(
  calls: Calls,
  window: DateWindow,
  timeZone: string,
): TrendPoint[] {
  return listDays(window).map((day) => {
    const onDay = calls.filter(
      (c) => toDayKey(c.orderCreatedAt, timeZone) === day,
    );
    return {
      day,
      confirmed: countWhere(onDay, (c) => c.status === "confirmed"),
      cancelled: countWhere(onDay, (c) => c.status === "cancelled"),
      unreachable: countWhere(
        onDay,
        (c) => c.status === "no_answer" || c.status === "failed",
      ),
    };
  });
}

export interface AttentionCounts {
  unreachable: number;
  callback: number;
  incompleteAddress: number;
  duplicate: number;
  invalidNumber: number;
}

export function computeAttention(calls: Calls): AttentionCounts {
  return {
    unreachable: countWhere(calls, (c) => c.status === "no_answer"),
    callback: countWhere(calls, (c) => c.status === "callback"),
    incompleteAddress: countWhere(
      calls,
      (c) => c.addressQuality === "incomplete",
    ),
    duplicate: countWhere(calls, (c) => c.skipReason === "duplicate"),
    invalidNumber: countWhere(calls, (c) => c.skipReason === "invalid_number"),
  };
}

export function countAddressQuality(
  calls: Calls,
): Record<AddressQuality, number> {
  return {
    complete: countWhere(calls, (c) => c.addressQuality === "complete"),
    partial: countWhere(calls, (c) => c.addressQuality === "partial"),
    incomplete: countWhere(calls, (c) => c.addressQuality === "incomplete"),
  };
}

/** Total talk time across all attempts, in seconds. */
export function totalTalkSeconds(call: CallRecord): number {
  return call.attempts.reduce((sum, a) => sum + a.durationSeconds, 0);
}
