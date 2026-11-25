// Data layer for the RoboCall UI.
//
// Right now every function reads from the JSON files in app/mocks/.
// When the backend exists, swap the function bodies for real API/DB calls.
// The routes only call these functions, so none of them need to change.
// That's also why every function is async even though JSON is instant:
// the real versions will be async, so callers are already written for it.
//
// The ".server.ts" suffix tells React Router to keep this file out of the
// browser bundle, so a future API key here can never leak to the client.

import callsJson from "../mocks/calls.json";
import campaignsJson from "../mocks/campaigns.json";
import planFaqJson from "../mocks/plan-faq.json";
import planFeaturesJson from "../mocks/plan-features.json";
import plansJson from "../mocks/plans.json";
import segmentsJson from "../mocks/segments.json";
import settingsJson from "../mocks/settings.json";
import setupJson from "../mocks/setup.json";
import shopJson from "../mocks/shop.json";
import voicesJson from "../mocks/voices.json";
import type {
  CallRecord,
  Campaign,
  CustomerSegment,
  FaqItem,
  Plan,
  PlanFeatureCategory,
  SetupStep,
  Settings,
  Shop,
  Voice,
} from "../types/robocall";
import { filterCalls, type CallFilters } from "../utils/callFilters";

// JSON imports are typed loosely (e.g. status: string), so we assert the
// shapes here. That's acceptable for mocks we wrote ourselves, and tests in
// robocall.server.test.ts check the JSON really matches. Real API responses
// must be validated (e.g. with zod) instead of asserted.
const calls = callsJson as CallRecord[];
const campaigns = campaignsJson as Campaign[];
const plans = plansJson as Plan[];
const planFeatures = planFeaturesJson as PlanFeatureCategory[];
const planFaq = planFaqJson as FaqItem[];
const segments = segmentsJson as CustomerSegment[];
const settings = settingsJson as Settings;
const setupSteps = setupJson as SetupStep[];
const shop = shopJson as Shop;
const voices = voicesJson as Voice[];

const newestFirst = (a: CallRecord, b: CallRecord): number =>
  b.orderCreatedAt.localeCompare(a.orderCreatedAt);

export async function getShop(): Promise<Shop> {
  return shop;
}

export async function listCalls(filters: CallFilters = {}): Promise<CallRecord[]> {
  return [...filterCalls(calls, filters)].sort(newestFirst);
}

export async function getCall(id: string): Promise<CallRecord | null> {
  return calls.find((call) => call.id === id) ?? null;
}

export async function listSetupSteps(): Promise<SetupStep[]> {
  return setupSteps;
}

export async function listVoices(): Promise<Voice[]> {
  return voices;
}

export async function listPlans(): Promise<Plan[]> {
  return plans;
}

export async function listPlanFeatures(): Promise<PlanFeatureCategory[]> {
  return planFeatures;
}

export async function listPlanFaq(): Promise<FaqItem[]> {
  return planFaq;
}

export async function listCampaigns(): Promise<Campaign[]> {
  return [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSegments(): Promise<CustomerSegment[]> {
  return segments;
}

export async function getSettings(): Promise<Settings> {
  return settings;
}
