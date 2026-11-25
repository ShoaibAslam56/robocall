// Shared types for the RoboCall app.
// The JSON mocks in app/mocks/ follow these shapes, and the real backend's
// responses should too. That way, switching from mocks to the API only
// changes the data layer (app/data/robocall.server.ts) and leaves the UI alone.

// ── Calls ────────────────────────────────────────────────────────────────

export const CALL_STATUSES = [
  "confirmed", // customer pressed 1
  "cancelled", // customer pressed 2
  "callback", // customer pressed 3 (wants a human)
  "no_answer", // all retries used, nobody picked up
  "failed", // network/provider error
  "pending", // waiting for first call or a retry
  "not_initiated", // skipped before calling (see SkipReason)
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const SKIP_REASONS = [
  "app_off",
  "plan_limit",
  "invalid_number",
  "duplicate",
  "filtered",
] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

export const CALL_EVENTS = [
  "order_placed",
  "order_fulfilled",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "order_cancelled",
] as const;
export type CallEvent = (typeof CALL_EVENTS)[number];

export const CALL_TYPES = ["auto", "manual"] as const;
export type CallType = (typeof CALL_TYPES)[number];

export type AddressQuality = "complete" | "partial" | "incomplete";
export type AttemptResult = "answered" | "no_answer" | "busy" | "failed";
export type Dtmf = "1" | "2" | "3";

export interface CallAttempt {
  at: string; // ISO 8601, UTC
  result: AttemptResult;
  durationSeconds: number;
}

export interface CallRecord {
  id: string;
  orderId: number;
  orderName: string;
  orderCreatedAt: string; // ISO 8601, UTC
  customerName: string;
  phone: string;
  city: string;
  paymentMethod: "cod" | "prepaid";
  orderTotal: number;
  currency: string;
  event: CallEvent;
  callType: CallType;
  status: CallStatus;
  skipReason: SkipReason | null;
  dtmf: Dtmf | null;
  addressQuality: AddressQuality;
  addressScore: number;
  tags: string[];
  attempts: CallAttempt[];
}

// ── Shop & onboarding ────────────────────────────────────────────────────

export interface Shop {
  name: string;
  currency: string;
  timezone: string;
  today: string; // "YYYY-MM-DD". Fixed so mock date ranges stay stable.
  subscription: {
    planId: string | null;
    status: "trial" | "active" | "none";
    trialEndsOn: string | null;
  };
  usage: {
    ordersThisMonth: number;
    orderLimit: number | null;
    answeredPulsesThisMonth: number;
    usageChargesUsd: number;
  };
  support: { email: string; whatsapp: string };
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

// ── Voices, plans, campaigns ─────────────────────────────────────────────

export interface Voice {
  id: string;
  name: string;
  language: "ur" | "en";
  kind: "default" | "custom";
  durationSeconds: number;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyUsd: number;
  perPulseUsd: number; // charged per answered 30-second pulse
  orderLimit: number | null; // null = unlimited
  trialDays: number;
  recommended: boolean;
  /** Id of the cheaper plan this one includes everything from. */
  basedOn: string | null;
  features: string[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  size: number;
}

export interface PlanFeatureRow {
  feature: string;
  /** One value per plan, in the same order as plans.json. */
  values: Array<string | boolean>;
}

export interface PlanFeatureCategory {
  category: string;
  rows: PlanFeatureRow[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed";
export type AudienceSource = "segment" | "csv" | "sheet";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  audience: { source: AudienceSource; label: string; size: number };
  voiceId: string;
  createdAt: string;
  scheduledAt: string | null;
  stats: {
    placed: number;
    answered: number;
    interested: number; // pressed 1
    optedOut: number; // pressed 2
  };
}

// ── Settings ─────────────────────────────────────────────────────────────

export interface BreakHour {
  id: string;
  label: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface EventRule {
  event: CallEvent;
  enabled: boolean;
  voiceId: string;
  delayMinutes: number;
}

export interface Settings {
  general: {
    appEnabled: boolean;
    storeName: string;
    callMode: "auto" | "manual";
    timezone: string;
    /** Note on the Thank you page telling customers to expect the call. */
    thankYouNoticeEnabled: boolean;
  };
  calling: {
    defaultVoiceId: string;
    ivrOptions: 2 | 3;
    callingWindow: "always" | "custom";
    callingHoursStart: string;
    callingHoursEnd: string;
    breakHours: BreakHour[];
    retryIntervalsMinutes: number[];
    firstCallDelayMinutes: number;
  };
  automation: {
    events: EventRule[];
    codOnly: boolean;
    webOrdersOnly: boolean;
    minCodAmount: number;
    excludedCities: string[];
    excludedTags: string[];
    autoCancel: { enabled: boolean; afterHours: number; cancelInShopify: boolean };
    tags: {
      confirmed: string;
      cancelled: string;
      pending: string;
      callback: string;
      feedbackPositive: string;
      feedbackNegative: string;
    };
  };
  protection: {
    addressValidator: {
      enabled: boolean;
      incompleteBelow: number;
      completeFrom: number;
      incompleteTag: string;
      partialTag: string;
    };
    duplicates: { enabled: boolean; windowMinutes: number; skipCall: boolean; tag: string };
    invalidNumbers: { enabled: boolean; skipCall: boolean; tag: string };
  };
}

// ── Dashboard metrics ────────────────────────────────────────────────────

export interface Kpis {
  ordersCalled: number;
  answerRate: number | null; // 0–100, null when nothing was called
  confirmationRate: number | null; // 0–100 of answered calls
  codValueProtected: number; // total of COD orders cancelled by phone
}
