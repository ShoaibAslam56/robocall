import { describe, expect, test } from "vitest";

import { answered, makeCall, missed } from "../test/factories";
import {
  computeAttention,
  computeDailyTrend,
  computeFunnel,
  computeKpis,
  countAddressQuality,
  countSkipReasons,
  percentChange,
  percentOf,
  totalTalkSeconds,
} from "./stats";

const notCalled = (skipReason: "duplicate" | "invalid_number" | "filtered") =>
  makeCall({ status: "not_initiated", skipReason, dtmf: null, attempts: [] });

describe("percentOf", () => {
  test("rounds to a whole percent", () => {
    expect(percentOf(1, 3)).toBe(33);
  });

  test("returns 0 instead of NaN when the total is 0", () => {
    expect(percentOf(5, 0)).toBe(0);
  });
});

describe("percentChange", () => {
  test("returns null when there is no previous value to compare with", () => {
    expect(percentChange(10, 0)).toBeNull();
  });

  test("handles growth and decline", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
  });
});

describe("computeKpis", () => {
  test("returns null rates (not 0%) when nothing was called", () => {
    const kpis = computeKpis([notCalled("duplicate")]);

    expect(kpis).toEqual({
      ordersCalled: 0,
      answerRate: null,
      confirmationRate: null,
      codValueProtected: 0,
    });
  });

  test("answer rate is answered / called, confirmation rate is confirmed / answered", () => {
    const kpis = computeKpis([
      makeCall({ status: "confirmed" }),
      makeCall({ status: "cancelled", dtmf: "2" }),
      makeCall({
        status: "no_answer",
        dtmf: null,
        attempts: [missed(), missed(), missed()],
      }),
      makeCall({ status: "no_answer", dtmf: null, attempts: [missed()] }),
    ]);

    expect(kpis.ordersCalled).toBe(4);
    expect(kpis.answerRate).toBe(50);
    expect(kpis.confirmationRate).toBe(50);
  });

  test("only counts cancelled COD orders as fake value stopped", () => {
    const kpis = computeKpis([
      makeCall({ status: "cancelled", paymentMethod: "cod", orderTotal: 3000 }),
      makeCall({
        status: "cancelled",
        paymentMethod: "prepaid",
        orderTotal: 9000,
      }),
      makeCall({ status: "confirmed", paymentMethod: "cod", orderTotal: 5000 }),
    ]);

    expect(kpis.codValueProtected).toBe(3000);
  });
});

describe("computeFunnel", () => {
  test("follows orders from received to outcome", () => {
    const funnel = computeFunnel([
      makeCall({ status: "confirmed" }),
      makeCall({ status: "callback", dtmf: "3" }),
      makeCall({
        status: "failed",
        dtmf: null,
        attempts: [{ ...missed(), result: "failed" }],
      }),
      makeCall({ status: "pending", dtmf: null, attempts: [] }),
      notCalled("invalid_number"),
    ]);

    expect(funnel.received).toBe(5);
    expect(funnel.notCalled).toBe(1);
    expect(funnel.placed).toBe(3);
    expect(funnel.answered).toBe(2);
    expect(funnel.outcomes).toEqual({
      confirmed: 1,
      cancelled: 0,
      callback: 1,
      unreachable: 1,
      inProgress: 1,
    });
  });
});

test("a pending order that already had one attempt isn't counted as 'not called'", () => {
  // Regression: notCalled used to be received − placed − inProgress, which
  // subtracted this order twice (it's both placed and in progress).
  const funnel = computeFunnel([
    makeCall({ status: "pending", dtmf: null, attempts: [missed()] }),
    notCalled("duplicate"),
  ]);

  expect(funnel.notCalled).toBe(1);
});

describe("countSkipReasons", () => {
  test("has an entry for every reason, including zeros", () => {
    const counts = countSkipReasons([
      notCalled("duplicate"),
      notCalled("duplicate"),
    ]);

    expect(counts).toEqual({
      app_off: 0,
      plan_limit: 0,
      invalid_number: 0,
      duplicate: 2,
      filtered: 0,
    });
  });
});

describe("computeDailyTrend", () => {
  test("groups by the shop's local day, not the UTC day", () => {
    // 20:00 UTC on Nov 23 is 01:00 on Nov 24 in Karachi (UTC+5).
    const lateNight = makeCall({ orderCreatedAt: "2026-11-23T20:00:00Z" });

    const trend = computeDailyTrend(
      [lateNight],
      { start: "2026-11-23", end: "2026-11-24" },
      "Asia/Karachi",
    );

    expect(trend).toEqual([
      { day: "2026-11-23", confirmed: 0, cancelled: 0, unreachable: 0 },
      { day: "2026-11-24", confirmed: 1, cancelled: 0, unreachable: 0 },
    ]);
  });
});

describe("computeAttention", () => {
  test("counts each kind of problem", () => {
    const counts = computeAttention([
      makeCall({ status: "callback", dtmf: "3" }),
      makeCall({ status: "no_answer", dtmf: null }),
      makeCall({ addressQuality: "incomplete" }),
      notCalled("duplicate"),
      notCalled("invalid_number"),
    ]);

    expect(counts).toEqual({
      unreachable: 1,
      callback: 1,
      incompleteAddress: 1,
      duplicate: 1,
      invalidNumber: 1,
    });
  });
});

describe("countAddressQuality", () => {
  test("counts each band", () => {
    expect(
      countAddressQuality([
        makeCall({ addressQuality: "complete" }),
        makeCall({ addressQuality: "partial" }),
        makeCall({ addressQuality: "partial" }),
      ]),
    ).toEqual({ complete: 1, partial: 2, incomplete: 0 });
  });
});

describe("totalTalkSeconds", () => {
  test("adds up every attempt", () => {
    expect(
      totalTalkSeconds(makeCall({ attempts: [missed(), answered(42)] })),
    ).toBe(42);
  });
});
