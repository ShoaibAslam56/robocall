import { describe, expect, test } from "vitest";

import { validateCampaign, type CampaignDraft } from "./campaign";

const TODAY = "2026-11-24";
const valid: CampaignDraft = {
  name: "Winter sale",
  source: "segment",
  audienceSize: 1200,
  sheetUrl: "",
  sendMode: "now",
  date: TODAY,
  time: "10:00",
};

describe("validateCampaign", () => {
  test("a complete draft has no errors", () => {
    expect(validateCampaign(valid, TODAY)).toEqual({});
  });

  test("requires a name that isn't just spaces, and not too long", () => {
    expect(
      validateCampaign({ ...valid, name: "   " }, TODAY).name,
    ).toBeDefined();
    expect(
      validateCampaign({ ...valid, name: "x".repeat(61) }, TODAY).name,
    ).toBeDefined();
  });

  test("requires an audience for segments and CSV uploads", () => {
    expect(
      validateCampaign({ ...valid, audienceSize: 0 }, TODAY).audience,
    ).toMatch(/Choose/);
    expect(
      validateCampaign({ ...valid, source: "csv", audienceSize: 0 }, TODAY)
        .audience,
    ).toMatch(/CSV/);
  });

  test("only accepts real Google Sheets links", () => {
    const sheet = { ...valid, source: "sheet" as const, audienceSize: 0 };

    expect(
      validateCampaign(
        { ...sheet, sheetUrl: "https://docs.google.com/spreadsheets/d/abc" },
        TODAY,
      ),
    ).toEqual({});
    expect(
      validateCampaign(
        { ...sheet, sheetUrl: "https://evil.com/spreadsheets/d/abc" },
        TODAY,
      ).sheetUrl,
    ).toBeDefined();
    expect(
      validateCampaign(
        { ...sheet, sheetUrl: "http://docs.google.com/spreadsheets/d/abc" },
        TODAY,
      ).sheetUrl,
    ).toBeDefined();
    expect(
      validateCampaign({ ...sheet, sheetUrl: "not a url" }, TODAY).sheetUrl,
    ).toBeDefined();
  });

  test("a scheduled campaign can't be in the past", () => {
    expect(
      validateCampaign(
        { ...valid, sendMode: "later", date: "2026-11-23" },
        TODAY,
      ).date,
    ).toBeDefined();
    expect(
      validateCampaign({ ...valid, sendMode: "later", date: "" }, TODAY).date,
    ).toBeDefined();
    expect(
      validateCampaign({ ...valid, sendMode: "later", date: TODAY }, TODAY),
    ).toEqual({});
  });
});
