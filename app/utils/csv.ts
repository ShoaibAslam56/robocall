// Build CSV text in the browser. No server needed.

// Spreadsheet apps run cells that start with these characters as formulas.
// A customer named "=HYPERLINK(...)" could otherwise run in a merchant's
// Excel. Prefixing a single quote makes the cell plain text.
// Note that "+" is on the list, and every phone number starts with "+92".
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  const safe = FORMULA_TRIGGERS.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(
  rows: ReadonlyArray<ReadonlyArray<string | number | null>>,
): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/** Browser-only: triggers a file download. */
export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel read the file as UTF-8 (Urdu names stay intact).
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Data rows in a CSV (non-empty lines minus the header row). */
export function countCsvRows(text: string): number {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  return Math.max(0, lines.length - 1);
}
