import { describe, expect, test } from "vitest";

import { CALL_STATUSES } from "../types/robocall";
import {
  STATUS_DISPLAY,
  formatDateTime,
  formatDuration,
  formatMoney,
} from "./format";

describe("formatDuration", () => {
  test("shows a dash for calls that never connected", () => {
    expect(formatDuration(0)).toBe("—");
    expect(formatDuration(-5)).toBe("—");
  });

  test("shows only seconds under a minute", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  test("shows minutes and seconds from one minute up", () => {
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(125)).toBe("2m 5s");
  });
});

describe("formatDateTime", () => {
  test("formats in UTC so server and browser render the same text", () => {
    expect(formatDateTime("2026-11-24T14:32:00Z")).toBe("Nov 24, 2:32 PM UTC");
  });

  test("shows a dash instead of 'Invalid Date' for bad input", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

describe("formatMoney", () => {
  test("formats with the currency symbol and two decimals", () => {
    expect(formatMoney(59.99, "USD")).toBe("$59.99");
    expect(formatMoney(120, "USD")).toBe("$120.00");
  });
});

describe("STATUS_DISPLAY", () => {
  test("has a label for every call status", () => {
    for (const status of CALL_STATUSES) {
      expect(STATUS_DISPLAY[status].label).toBeTruthy();
    }
  });
});
