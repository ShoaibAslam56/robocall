import { describe, expect, test, vi } from "vitest";

// The route file imports shopify.server, which needs env vars and a DB.
// We only test the pure helper, so stub that module out.
vi.mock("../shopify.server", () => ({ authenticate: {} }));

import { parseStatusParam } from "./app.calls";

describe("parseStatusParam", () => {
  test("accepts a known status", () => {
    expect(parseStatusParam("failed")).toBe("failed");
  });

  test("ignores a missing param", () => {
    expect(parseStatusParam(null)).toBeUndefined();
  });

  test("ignores unknown values instead of trusting the URL", () => {
    expect(parseStatusParam("hacked")).toBeUndefined();
    expect(parseStatusParam("FAILED")).toBeUndefined();
  });
});
