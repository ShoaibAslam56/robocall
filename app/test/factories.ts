import type { CallAttempt, CallRecord } from "../types/robocall";

export const answered = (durationSeconds = 30): CallAttempt => ({
  at: "2026-11-24T10:05:00Z",
  result: "answered",
  durationSeconds,
});

export const missed = (): CallAttempt => ({
  at: "2026-11-24T10:00:00Z",
  result: "no_answer",
  durationSeconds: 0,
});

let nextId = 1;

/** A valid call record with sensible defaults. Override only what a test cares about. */
export function makeCall(overrides: Partial<CallRecord> = {}): CallRecord {
  const id = nextId++;
  return {
    id: `rc_test_${id}`,
    orderId: 1000 + id,
    orderName: `#${1000 + id}`,
    orderCreatedAt: "2026-11-24T10:00:00Z",
    customerName: "Ayesha Khan",
    phone: "+92 300 1234567",
    city: "Lahore",
    paymentMethod: "cod",
    orderTotal: 2500,
    currency: "PKR",
    event: "order_placed",
    callType: "auto",
    status: "confirmed",
    skipReason: null,
    dtmf: "1",
    addressQuality: "complete",
    addressScore: 80,
    tags: [],
    attempts: [answered()],
    ...overrides,
  };
}
