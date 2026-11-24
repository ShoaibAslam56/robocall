import type { CallStatus, FlowTrigger } from "../types/robocall";

// Polaris <s-badge> tones.
export type BadgeTone =
  | "success"
  | "critical"
  | "warning"
  | "info"
  | "neutral"
  | "auto";

interface StatusDisplay {
  label: string;
  tone: BadgeTone;
}

export const STATUS_DISPLAY: Record<CallStatus, StatusDisplay> = {
  confirmed: { label: "Confirmed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "warning" },
  no_answer: { label: "No answer", tone: "neutral" },
  failed: { label: "Failed", tone: "critical" },
  queued: { label: "Queued", tone: "info" },
};

export const TRIGGER_LABELS: Record<FlowTrigger, string> = {
  order_created_cod: "New COD order",
  checkout_abandoned: "Checkout abandoned",
  order_fulfilled: "Order fulfilled",
};

const SECONDS_PER_MINUTE = 60;

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

// Locale and time zone are fixed on purpose. This runs on the server
// (SSR) and again in the browser (hydration). If each side used its own
// default time zone, the text would differ and React would warn about a
// hydration mismatch. Later, use the shop's time zone from the Admin API.
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}
