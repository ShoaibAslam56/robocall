import { describe, expect, test } from "vitest";

import {
  addDays,
  daysBetween,
  getRangeWindows,
  isInWindow,
  listDays,
  toDayKey,
} from "./dates";

describe("toDayKey", () => {
  test("uses the shop's local date", () => {
    expect(toDayKey("2026-11-23T20:00:00Z", "Asia/Karachi")).toBe("2026-11-24");
    expect(toDayKey("2026-11-23T20:00:00Z", "UTC")).toBe("2026-11-23");
  });
});

describe("addDays", () => {
  test("crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("getRangeWindows", () => {
  test("last 7 days includes today, and the previous window is the 7 days before", () => {
    expect(getRangeWindows("2026-11-24", 7)).toEqual({
      current: { start: "2026-11-18", end: "2026-11-24" },
      previous: { start: "2026-11-11", end: "2026-11-17" },
    });
  });
});

describe("isInWindow / listDays", () => {
  const window = { start: "2026-11-22", end: "2026-11-24" };

  test("is inclusive on both ends", () => {
    expect(isInWindow("2026-11-22", window)).toBe(true);
    expect(isInWindow("2026-11-24", window)).toBe(true);
    expect(isInWindow("2026-11-25", window)).toBe(false);
  });

  test("lists every day oldest first", () => {
    expect(listDays(window)).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
    ]);
  });
});

describe("daysBetween", () => {
  test("counts whole days, negative when going back", () => {
    expect(daysBetween("2026-11-24", "2026-11-27")).toBe(3);
    expect(daysBetween("2026-11-27", "2026-11-24")).toBe(-3);
  });
});
