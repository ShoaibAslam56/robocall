import { describe, expect, test } from "vitest";

import { makeCall } from "../test/factories";
import {
  filterCalls,
  hasActiveFilters,
  paginate,
  parseCallFilters,
  parsePage,
} from "./callFilters";

const params = (query: string) => new URLSearchParams(query);

describe("parseCallFilters", () => {
  test("keeps known values", () => {
    expect(
      parseCallFilters(params("status=callback&skip=duplicate&type=manual")),
    ).toMatchObject({
      status: "callback",
      skip: "duplicate",
      type: "manual",
    });
  });

  test("ignores unknown values instead of trusting the URL", () => {
    const filters = parseCallFilters(
      params("status=hacked&event=<script>&address=FULL"),
    );

    expect(hasActiveFilters(filters)).toBe(false);
  });

  test("trims the search and caps its length", () => {
    expect(parseCallFilters(params("q=%20%20ali%20%20")).q).toBe("ali");
    expect(parseCallFilters(params(`q=${"x".repeat(500)}`)).q).toHaveLength(
      100,
    );
    expect(parseCallFilters(params("q=%20%20")).q).toBeUndefined();
  });
});

describe("parsePage", () => {
  test("falls back to page 1 for anything that isn't a positive whole number", () => {
    expect(parsePage(params("page=3"))).toBe(3);
    expect(parsePage(params("page=0"))).toBe(1);
    expect(parsePage(params("page=-2"))).toBe(1);
    expect(parsePage(params("page=abc"))).toBe(1);
    expect(parsePage(params(""))).toBe(1);
  });
});

describe("filterCalls", () => {
  const calls = [
    makeCall({
      orderName: "#1500",
      customerName: "Ali Raza",
      phone: "+92 300 1112233",
      city: "Karachi",
    }),
    makeCall({
      orderName: "#1501",
      customerName: "Sana Malik",
      phone: "+92 345 9998877",
      city: "Lahore",
      status: "callback",
    }),
  ];

  test("filters by status", () => {
    expect(
      filterCalls(calls, { status: "callback" }).map((c) => c.orderName),
    ).toEqual(["#1501"]);
  });

  test("searches order number, name, and city case-insensitively", () => {
    expect(filterCalls(calls, { q: "1500" })).toHaveLength(1);
    expect(filterCalls(calls, { q: "sana" })).toHaveLength(1);
    expect(filterCalls(calls, { q: "LAHORE" })).toHaveLength(1);
  });

  test("finds a phone typed in local format (0300…) or international (+92 300…)", () => {
    expect(filterCalls(calls, { q: "0300 111" })).toHaveLength(1);
    expect(filterCalls(calls, { q: "+92 345 999" })).toHaveLength(1);
  });

  test("returns everything when no filters are set", () => {
    expect(filterCalls(calls, {})).toHaveLength(2);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  test("returns the right slice and labels", () => {
    expect(paginate(items, 2, 20)).toMatchObject({
      items: items.slice(20, 40),
      page: 2,
      totalPages: 3,
      firstItem: 21,
      lastItem: 40,
    });
  });

  test("clamps a page past the end to the last page", () => {
    expect(paginate(items, 99, 20).page).toBe(3);
  });

  test("handles an empty list", () => {
    expect(paginate([], 1, 20)).toMatchObject({
      items: [],
      totalPages: 1,
      firstItem: 0,
      lastItem: 0,
    });
  });
});
