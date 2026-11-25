import { describe, expect, test } from "vitest";

import {
  CALL_EVENTS,
  CALL_STATUSES,
  CALL_TYPES,
  SKIP_REASONS,
} from "../types/robocall";
import {
  getCall,
  getSettings,
  getShop,
  listCalls,
  listCampaigns,
  listPlanFaq,
  listPlanFeatures,
  listPlans,
  listSetupSteps,
  listVoices,
} from "./robocall.server";

describe("listCalls", () => {
  test("returns calls newest first", async () => {
    const times = (await listCalls()).map((c) => c.orderCreatedAt);

    expect(times).toEqual([...times].sort().reverse());
  });

  test("applies filters", async () => {
    const callbacks = await listCalls({ status: "callback" });

    expect(callbacks.length).toBeGreaterThan(0);
    expect(callbacks.every((c) => c.status === "callback")).toBe(true);
  });

  test("does not reorder the underlying mock data between calls", async () => {
    const first = await listCalls();
    await listCalls({ status: "confirmed" });

    expect(await listCalls()).toEqual(first);
  });
});

describe("getCall", () => {
  test("finds a call by id, or returns null", async () => {
    const [someCall] = await listCalls();

    expect(await getCall(someCall.id)).toEqual(someCall);
    expect(await getCall("does-not-exist")).toBeNull();
  });
});

// These guard the JSON files. A typo like "status": "confirmd" slips past
// the type assertion in the data layer, but fails here.
describe("mock data integrity", () => {
  test("every call uses known values", async () => {
    for (const call of await listCalls()) {
      expect(CALL_STATUSES).toContain(call.status);
      expect(CALL_EVENTS).toContain(call.event);
      expect(CALL_TYPES).toContain(call.callType);
      if (call.skipReason) expect(SKIP_REASONS).toContain(call.skipReason);
    }
  });

  test("status, key press, and skip reason agree with each other", async () => {
    const dtmfFor: Record<string, string> = { confirmed: "1", cancelled: "2", callback: "3" };
    for (const call of await listCalls()) {
      expect(call.dtmf).toBe(dtmfFor[call.status] ?? null);
      expect(call.skipReason !== null).toBe(call.status === "not_initiated");
      if (call.status === "not_initiated") expect(call.attempts).toHaveLength(0);
    }
  });

  test("call ids are unique", async () => {
    const calls = await listCalls();

    expect(new Set(calls.map((c) => c.id)).size).toBe(calls.length);
  });

  test("voices, plans, and setup links point at things that exist", async () => {
    const [voices, plans, settings, shop, steps, campaigns] = await Promise.all([
      listVoices(),
      listPlans(),
      getSettings(),
      getShop(),
      listSetupSteps(),
      listCampaigns(),
    ]);
    const voiceIds = new Set(voices.map((v) => v.id));

    expect(voiceIds.has(settings.calling.defaultVoiceId)).toBe(true);
    for (const rule of settings.automation.events) expect(voiceIds.has(rule.voiceId)).toBe(true);
    for (const campaign of campaigns) expect(voiceIds.has(campaign.voiceId)).toBe(true);
    expect(plans.map((p) => p.id)).toContain(shop.subscription.planId);
    for (const step of steps) expect(step.href).toMatch(/^\/app\//);
  });

  test("calling hours and address thresholds make sense", async () => {
    const { calling, protection } = await getSettings();
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

    expect(calling.callingHoursStart).toMatch(hhmm);
    expect(calling.callingHoursEnd).toMatch(hhmm);
    expect(calling.callingHoursStart < calling.callingHoursEnd).toBe(true);
    expect(protection.addressValidator.incompleteBelow).toBeLessThan(
      protection.addressValidator.completeFrom,
    );
  });

  test("every feature row has exactly one value per plan", async () => {
    const [plans, categories, faq] = await Promise.all([
      listPlans(),
      listPlanFeatures(),
      listPlanFaq(),
    ]);

    for (const category of categories) {
      for (const row of category.rows) {
        expect(row.values, row.feature).toHaveLength(plans.length);
      }
    }
    expect(faq.length).toBeGreaterThan(0);
  });
});
