import { describe, expect, test } from "vitest";

import type { Plan } from "../types/robocall";
import {
  estimateCampaignCost,
  estimateMonthlyCost,
  pulsesFor,
} from "./pricing";

const plan: Plan = {
  id: "growth",
  name: "Growth",
  tagline: "For stores shipping COD orders every day.",
  monthlyUsd: 12,
  perPulseUsd: 0.017,
  orderLimit: 2500,
  trialDays: 3,
  recommended: true,
  basedOn: "starter",
  features: [],
};

describe("pulsesFor", () => {
  test("every started 30 seconds is one pulse, minimum one", () => {
    expect(pulsesFor(0)).toBe(1);
    expect(pulsesFor(30)).toBe(1);
    expect(pulsesFor(31)).toBe(2);
    expect(pulsesFor(61)).toBe(3);
  });
});

describe("estimateMonthlyCost", () => {
  test("plan fee + answered calls × per-pulse price", () => {
    // 500 orders × 70% = 350 answered × $0.017 = $5.95, + $12 = $17.95
    expect(estimateMonthlyCost(plan, 500, 70)).toEqual({
      answeredCalls: 350,
      usageUsd: 5.95,
      totalUsd: 17.95,
      exceedsLimit: false,
    });
  });

  test("flags when orders go over the plan limit", () => {
    expect(estimateMonthlyCost(plan, 3000, 70).exceedsLimit).toBe(true);
    expect(
      estimateMonthlyCost({ ...plan, orderLimit: null }, 999_999, 70)
        .exceedsLimit,
    ).toBe(false);
  });

  test("treats negative or fractional orders sensibly", () => {
    expect(estimateMonthlyCost(plan, -10, 70).totalUsd).toBe(12);
    expect(estimateMonthlyCost(plan, 10.9, 100).answeredCalls).toBe(10);
  });
});

describe("estimateCampaignCost", () => {
  test("longer messages cost more pulses", () => {
    expect(estimateCampaignCost(1000, 65, 26, 0.02)).toEqual({
      answeredCalls: 650,
      totalUsd: 13,
    });
    expect(estimateCampaignCost(1000, 65, 31, 0.02)).toEqual({
      answeredCalls: 650,
      totalUsd: 26,
    });
  });
});
