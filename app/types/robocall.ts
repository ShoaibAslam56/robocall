// Shared types for the RoboCall app.
// The JSON mocks in app/mocks/ follow these shapes, and the real backend's
// responses should too. That way, switching from mocks to the API only
// changes the data layer and leaves the UI alone.

export const CALL_STATUSES = [
  "confirmed",
  "cancelled",
  "no_answer",
  "failed",
  "queued",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export type FlowTrigger =
  | "order_created_cod"
  | "checkout_abandoned"
  | "order_fulfilled";

export interface CallRecord {
  id: string;
  orderName: string;
  customerName: string;
  phone: string;
  flowId: string;
  status: CallStatus;
  durationSeconds: number;
  attempts: number;
  startedAt: string; // ISO 8601, UTC
  orderTotal: number;
  currency: string;
}

export interface CallFlow {
  id: string;
  name: string;
  trigger: FlowTrigger;
  enabled: boolean;
  delayMinutes: number;
  maxAttempts: number;
  language: string;
  script: string;
}

export interface CallSettings {
  callerName: string;
  voice: string;
  language: string;
  timezone: string;
  callingHoursStart: string; // "HH:MM"
  callingHoursEnd: string; // "HH:MM"
  retryDelayMinutes: number;
  maxAttemptsPerOrder: number;
  requireConsent: boolean;
}

export interface CallStats {
  totalCalls: number;
  confirmed: number;
  cancelled: number;
  failedOrNoAnswer: number;
  confirmationRate: number; // 0–100, rounded
  averageDurationSeconds: number;
}
