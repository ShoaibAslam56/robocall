import { describe, expect, test } from "vitest";

import { formatTimeLabel, fromMinutes, timeSlots, toMinutes } from "./time";

describe("toMinutes / fromMinutes", () => {
  test("round-trips", () => {
    expect(toMinutes("13:30")).toBe(810);
    expect(fromMinutes(810)).toBe("13:30");
    expect(fromMinutes(5)).toBe("00:05");
  });
});

describe("timeSlots", () => {
  test("half-hour slots, inclusive of both ends", () => {
    expect(timeSlots("10:00", "11:30")).toEqual([
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  test("whole day by default, never past midnight", () => {
    const slots = timeSlots();
    expect(slots).toHaveLength(48);
    expect(slots.at(-1)).toBe("23:30");
  });
});

describe("formatTimeLabel", () => {
  test("12-hour clock with AM/PM", () => {
    expect(formatTimeLabel("00:00")).toBe("12:00 AM");
    expect(formatTimeLabel("09:30")).toBe("9:30 AM");
    expect(formatTimeLabel("12:00")).toBe("12:00 PM");
    expect(formatTimeLabel("21:00")).toBe("9:00 PM");
  });
});
