import { describe, expect, test } from "vitest";

import { CALL_STATUSES } from "../types/robocall";
import { getSettings, listCalls, listFlows } from "./robocall.server";

describe("listCalls", () => {
  test("returns calls newest first", async () => {
    const calls = await listCalls();
    const times = calls.map((c) => c.startedAt);

    expect(times).toEqual([...times].sort().reverse());
  });

  test("filters by status", async () => {
    const failed = await listCalls({ status: "failed" });

    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((c) => c.status === "failed")).toBe(true);
  });

  test("respects the limit", async () => {
    const calls = await listCalls({ limit: 3 });

    expect(calls).toHaveLength(3);
  });

  test("does not reorder the underlying mock data between calls", async () => {
    const first = await listCalls();
    await listCalls({ status: "confirmed" });
    const second = await listCalls();

    expect(second).toEqual(first);
  });
});

// These guard the JSON files: a typo like "status": "confirmd" would
// slip past the type assertion in the data layer but fail here.
describe("mock data integrity", () => {
  test("every call has a known status and points to a real flow", async () => {
    const [calls, flows] = await Promise.all([listCalls(), listFlows()]);
    const flowIds = new Set(flows.map((f) => f.id));

    for (const call of calls) {
      expect(CALL_STATUSES).toContain(call.status);
      expect(flowIds.has(call.flowId)).toBe(true);
    }
  });

  test("call ids are unique", async () => {
    const calls = await listCalls();
    const ids = new Set(calls.map((c) => c.id));

    expect(ids.size).toBe(calls.length);
  });

  test("calling hours are valid HH:MM with start before end", async () => {
    const settings = await getSettings();
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

    expect(settings.callingHoursStart).toMatch(hhmm);
    expect(settings.callingHoursEnd).toMatch(hhmm);
    expect(settings.callingHoursStart < settings.callingHoursEnd).toBe(true);
  });
});
