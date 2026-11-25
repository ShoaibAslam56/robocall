// "HH:MM" helpers. Polaris has no time picker, so we offer half-hour
// slots in a <s-select>, which is also easier to tap on a phone.

const SLOT_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Half-hour slots from start to end, inclusive. Defaults to the whole day. */
export function timeSlots(start = "00:00", end = "23:30"): string[] {
  const slots: string[] = [];
  for (
    let t = toMinutes(start);
    t <= toMinutes(end) && t < MINUTES_PER_DAY;
    t += SLOT_MINUTES
  ) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

/** "13:30" → "1:30 PM" */
export function formatTimeLabel(hhmm: string): string {
  const minutes = toMinutes(hhmm);
  const h24 = Math.floor(minutes / 60);
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}
