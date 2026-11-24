import type { CallRecord, CallStats } from "../types/robocall";

// Pure function: same input → same output, no side effects.
// That makes it trivial to unit test, and it can run on server or client.
export function computeCallStats(calls: readonly CallRecord[]): CallStats {
  // Queued calls haven't happened yet, so they don't count toward results.
  const completed = calls.filter((c) => c.status !== "queued");
  const countOf = (status: CallRecord["status"]): number =>
    completed.filter((c) => c.status === status).length;

  const confirmed = countOf("confirmed");
  const cancelled = countOf("cancelled");
  const failedOrNoAnswer = countOf("failed") + countOf("no_answer");

  const answered = completed.filter((c) => c.durationSeconds > 0);
  const totalDuration = answered.reduce((sum, c) => sum + c.durationSeconds, 0);

  return {
    totalCalls: completed.length,
    confirmed,
    cancelled,
    failedOrNoAnswer,
    confirmationRate:
      completed.length === 0
        ? 0
        : Math.round((confirmed / completed.length) * 100),
    averageDurationSeconds:
      answered.length === 0 ? 0 : Math.round(totalDuration / answered.length),
  };
}
