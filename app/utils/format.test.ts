import { describe, expect, test } from "vitest";

import { CALL_STATUSES, SKIP_REASONS } from "../types/robocall";
import {
  SKIP_REASON_LABELS,
  STATUS_DISPLAY,
  formatDateTime,
  formatDayKey,
  formatDelay,
  formatDuration,
  formatMoney,
  formatPercent,
  formatUsd,
} from "./format";

describe("formatDuration", () => {
  test("shows a dash for calls that never connected", () => {
    expect(formatDuration(0)).toBe("—");
  });

  test("shows seconds, then minutes and seconds", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(125)).toBe("2m 5s");
  });
});

describe("formatDateTime", () => {
  test("shows the time in the shop's time zone", () => {
    // 14:32 UTC is 7:32 PM in Karachi.
    expect(formatDateTime("2026-11-24T14:32:00Z", "Asia/Karachi")).toBe(
      "Nov 24, 7:32 PM",
    );
  });

  test("shows a dash instead of 'Invalid Date' for bad input", () => {
    expect(formatDateTime("not-a-date", "Asia/Karachi")).toBe("—");
  });
});

describe("formatDayKey", () => {
  test("formats a day key without shifting it by time zone", () => {
    expect(formatDayKey("2026-11-24")).toBe("Nov 24");
  });
});

describe("money and numbers", () => {
  test("PKR has no decimals and uses a normal space", () => {
    expect(formatMoney(4300, "PKR")).toBe("PKR 4,300");
  });

  test("USD keeps cents and allows a third decimal for per-pulse prices", () => {
    expect(formatUsd(12)).toBe("$12.00");
    expect(formatUsd(0.017)).toBe("$0.017");
  });

  test("formatPercent shows a dash for missing values", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(72)).toBe("72%");
  });
});

describe("formatDelay", () => {
  test("covers instant, minutes, and hours", () => {
    expect(formatDelay(0)).toBe("Instantly");
    expect(formatDelay(15)).toBe("After 15 min");
    expect(formatDelay(60)).toBe("After 1 hour");
    expect(formatDelay(1440)).toBe("After 24 hours");
  });
});

describe("display maps", () => {
  test("every call status and skip reason has a label", () => {
    for (const status of CALL_STATUSES)
      expect(STATUS_DISPLAY[status].label).toBeTruthy();
    for (const reason of SKIP_REASONS)
      expect(SKIP_REASON_LABELS[reason]).toBeTruthy();
  });
});
