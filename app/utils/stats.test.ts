import { describe, expect, test } from "vitest";

import type { CallRecord, CallStatus } from "../types/robocall";
import { computeCallStats } from "./stats";

function makeCall(status: CallStatus, durationSeconds = 0): CallRecord {
  return {
    id: `call_${status}_${durationSeconds}`,
    orderName: "#1",
    customerName: "Test",
    phone: "+1 555-0100",
    flowId: "cod-confirmation",
    status,
    durationSeconds,
    attempts: 1,
    startedAt: "2026-11-24T10:00:00Z",
    orderTotal: 10,
    currency: "USD",
  };
}

describe("computeCallStats", () => {
  test("returns zeros (not NaN) when there are no calls", () => {
    const stats = computeCallStats([]);

    expect(stats).toEqual({
      totalCalls: 0,
      confirmed: 0,
      cancelled: 0,
      failedOrNoAnswer: 0,
      confirmationRate: 0,
      averageDurationSeconds: 0,
    });
  });

  test("ignores queued calls because they have not happened yet", () => {
    const stats = computeCallStats([
      makeCall("confirmed", 40),
      makeCall("queued"),
    ]);

    expect(stats.totalCalls).toBe(1);
    expect(stats.confirmationRate).toBe(100);
  });

  test("groups failed and no-answer calls together", () => {
    const stats = computeCallStats([
      makeCall("failed"),
      makeCall("no_answer"),
      makeCall("cancelled", 20),
    ]);

    expect(stats.failedOrNoAnswer).toBe(2);
    expect(stats.cancelled).toBe(1);
  });

  test("rounds the confirmation rate to a whole percent", () => {
    const stats = computeCallStats([
      makeCall("confirmed", 30),
      makeCall("cancelled", 30),
      makeCall("failed"),
    ]);

    expect(stats.confirmationRate).toBe(33);
  });

  test("averages duration over answered calls only", () => {
    const stats = computeCallStats([
      makeCall("confirmed", 40),
      makeCall("cancelled", 21),
      makeCall("no_answer", 0),
    ]);

    // (40 + 21) / 2 = 30.5 → 31. The unanswered call must not drag it down.
    expect(stats.averageDurationSeconds).toBe(31);
  });

  test("does not mutate the input array", () => {
    const calls = Object.freeze([makeCall("confirmed", 10)]);

    expect(() => computeCallStats(calls)).not.toThrow();
  });
});
