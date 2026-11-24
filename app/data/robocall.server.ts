// Data layer for the RoboCall UI.
//
// Right now every function reads from the JSON files in app/mocks/.
// When the backend exists, swap the function bodies for real API/DB calls.
// The routes only call these functions, so none of them need to change.
//
// The ".server.ts" suffix tells React Router to keep this file out of the
// browser bundle, so a future API key here can never leak to the client.

import callsJson from "../mocks/calls.json";
import flowsJson from "../mocks/flows.json";
import settingsJson from "../mocks/settings.json";
import type {
  CallFlow,
  CallRecord,
  CallSettings,
  CallStatus,
} from "../types/robocall";

// JSON imports are typed loosely (e.g. status: string), so we assert the
// shapes here. That's acceptable for mocks we wrote ourselves. Real API
// responses must be validated (e.g. with zod) instead of asserted.
const calls = callsJson as CallRecord[];
const flows = flowsJson as CallFlow[];
const settings = settingsJson as CallSettings;

const newestFirst = (a: CallRecord, b: CallRecord): number =>
  b.startedAt.localeCompare(a.startedAt);

export interface ListCallsOptions {
  status?: CallStatus;
  limit?: number;
}

export async function listCalls(
  options: ListCallsOptions = {},
): Promise<CallRecord[]> {
  const { status, limit } = options;
  const filtered = status ? calls.filter((c) => c.status === status) : calls;
  const sorted = [...filtered].sort(newestFirst);
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

export async function listFlows(): Promise<CallFlow[]> {
  return flows;
}

export async function getSettings(): Promise<CallSettings> {
  return settings;
}
