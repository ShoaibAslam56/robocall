// Date helpers that work on "YYYY-MM-DD" day keys in the shop's time zone.
//
// Why day keys? "Which day was this order?" depends on the time zone.
// 11:30 PM in Karachi on Nov 23 is still Nov 23 for the merchant, even
// though it's 6:30 PM UTC. Converting every timestamp to the shop's local
// day once lets the rest of the code compare plain strings.

const DAY_MS = 86_400_000;

export interface DateWindow {
  start: string; // inclusive day key
  end: string; // inclusive day key
}

export function toDayKey(iso: string, timeZone: string): string {
  // "en-CA" formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** The last `days` days ending today, and the same-length period before it. */
export function getRangeWindows(
  today: string,
  days: number,
): { current: DateWindow; previous: DateWindow } {
  const currentStart = addDays(today, -(days - 1));
  return {
    current: { start: currentStart, end: today },
    previous: {
      start: addDays(currentStart, -days),
      end: addDays(currentStart, -1),
    },
  };
}

export function isInWindow(dayKey: string, window: DateWindow): boolean {
  return dayKey >= window.start && dayKey <= window.end;
}

/** Every day key in the window, oldest first. */
export function listDays(window: DateWindow): string[] {
  const days: string[] = [];
  for (let day = window.start; day <= window.end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** Whole days from `fromDay` to `toDay` (negative if toDay is earlier). */
export function daysBetween(fromDay: string, toDay: string): number {
  const toMs = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toMs(toDay) - toMs(fromDay)) / DAY_MS);
}
