import { describe, expect, test } from "vitest";

import { countCsvRows, escapeCsvCell, toCsv } from "./csv";

describe("escapeCsvCell", () => {
  test("leaves plain text alone", () => {
    expect(escapeCsvCell("Lahore")).toBe("Lahore");
  });

  test("quotes cells containing commas, quotes, or newlines", () => {
    expect(escapeCsvCell("House 5, Street 2")).toBe('"House 5, Street 2"');
    expect(escapeCsvCell('Say "hi"')).toBe('"Say ""hi"""');
  });

  test("neutralises spreadsheet formulas (CSV injection)", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil")')).toMatch(/^"'=/);
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  test("phone numbers starting with + stay text, not a formula", () => {
    expect(escapeCsvCell("+92 300 1234567")).toBe("'+92 300 1234567");
  });

  test("null becomes an empty cell, numbers stay numbers", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(2500)).toBe("2500");
  });
});

describe("toCsv", () => {
  test("joins cells with commas and rows with CRLF", () => {
    expect(
      toCsv([
        ["a", "b"],
        ["c", null],
      ]),
    ).toBe("a,b\r\nc,");
  });
});

describe("countCsvRows", () => {
  test("ignores the header and blank lines", () => {
    expect(countCsvRows("name,phone\nAli,0300\n\nSana,0345\n")).toBe(2);
    expect(countCsvRows("name,phone\r\nAli,0300\r\n")).toBe(1);
  });

  test("an empty or header-only file has no customers", () => {
    expect(countCsvRows("")).toBe(0);
    expect(countCsvRows("name,phone")).toBe(0);
  });
});
