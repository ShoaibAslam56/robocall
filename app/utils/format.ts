import type {
  AddressQuality,
  AttemptResult,
  AudienceSource,
  CallEvent,
  CallStatus,
  CallType,
  CampaignStatus,
  SkipReason,
} from "../types/robocall";

// Polaris <s-badge> tones.
export type BadgeTone =
  "success" | "critical" | "warning" | "caution" | "info" | "neutral" | "auto";

interface Display {
  label: string;
  tone: BadgeTone;
}

// One place for every label and color. If "Call-back" gets renamed, it
// changes on the dashboard, the logs, the filters, and the CSV at once.

export const STATUS_DISPLAY: Record<CallStatus, Display> = {
  confirmed: { label: "Confirmed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "critical" },
  callback: { label: "Call-back", tone: "info" },
  no_answer: { label: "No answer", tone: "warning" },
  failed: { label: "Failed", tone: "critical" },
  pending: { label: "Pending", tone: "neutral" },
  not_initiated: { label: "Not called", tone: "neutral" },
};

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  app_off: "App was off",
  plan_limit: "Plan limit reached",
  invalid_number: "Invalid number",
  duplicate: "Duplicate order",
  filtered: "Filtered by your rules",
};

export const EVENT_LABELS: Record<CallEvent, string> = {
  order_placed: "Order placed",
  order_fulfilled: "Order fulfilled",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered (feedback)",
  delivery_failed: "Delivery failed",
  order_cancelled: "Order cancelled",
};

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  auto: "Automatic",
  manual: "Manual",
};

export const ATTEMPT_RESULT_LABELS: Record<AttemptResult, string> = {
  answered: "Answered",
  no_answer: "No answer",
  busy: "Line busy",
  failed: "Call failed",
};

export const ADDRESS_DISPLAY: Record<AddressQuality, Display> = {
  complete: { label: "Complete", tone: "success" },
  partial: { label: "Partial", tone: "caution" },
  incomplete: { label: "Incomplete", tone: "critical" },
};

export const CAMPAIGN_STATUS_DISPLAY: Record<CampaignStatus, Display> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "info" },
  running: { label: "Running", tone: "success" },
  completed: { label: "Completed", tone: "auto" },
};

export const AUDIENCE_SOURCE_LABELS: Record<AudienceSource, string> = {
  segment: "Shopify customer segment",
  csv: "CSV upload",
  sheet: "Google Sheet",
};

const SECONDS_PER_MINUTE = 60;

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

// Locale and time zone are always explicit. This code runs on the server
// (SSR) and again in the browser (hydration). If each side used its own
// default time zone, the text would differ and React would warn about a
// hydration mismatch. We use the shop's time zone so merchants see local time.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  // "en-US" on purpose: rarer locales like "en-PK" can format slightly
  // differently in Node vs the browser, which breaks hydration.
  const created = new Intl.DateTimeFormat("en-US", { ...options, timeZone });
  formatterCache.set(key, created);
  return created;
}

function safeFormat(
  iso: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return getFormatter(timeZone, options).format(date);
}

export function formatDateTime(iso: string, timeZone: string): string {
  return safeFormat(iso, timeZone, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso: string, timeZone: string): string {
  return safeFormat(iso, timeZone, { hour: "numeric", minute: "2-digit" });
}

/** "2026-11-24" → "Nov 24". Day keys are already local, so format as UTC. */
export function formatDayKey(dayKey: string): string {
  return safeFormat(`${dayKey}T00:00:00Z`, "UTC", {
    month: "short",
    day: "numeric",
  });
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: currency === "PKR" ? 0 : 2,
  })
    .format(amount)
    .replace(/\u00a0/g, " ");
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export function formatDelay(minutes: number): string {
  if (minutes === 0) return "Instantly";
  if (minutes < 60) return `After ${minutes} min`;
  const hours = minutes / 60;
  return `After ${hours} hour${hours === 1 ? "" : "s"}`;
}
