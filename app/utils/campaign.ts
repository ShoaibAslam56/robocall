import type { AudienceSource } from "../types/robocall";

export const MAX_CAMPAIGN_NAME_LENGTH = 60;

export interface CampaignDraft {
  name: string;
  source: AudienceSource;
  audienceSize: number;
  sheetUrl: string;
  sendMode: "now" | "later";
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
}

export type CampaignErrors = Partial<
  Record<"name" | "audience" | "sheetUrl" | "date", string>
>;

function isGoogleSheetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "docs.google.com" &&
      url.pathname.startsWith("/spreadsheets/")
    );
  } catch {
    return false;
  }
}

// Client-side checks so merchants get instant feedback. When the backend
// exists it must run the same checks again: anything sent from the
// browser can be faked.
export function validateCampaign(
  draft: CampaignDraft,
  today: string,
): CampaignErrors {
  const errors: CampaignErrors = {};
  const name = draft.name.trim();

  if (!name) errors.name = "Give your campaign a name.";
  else if (name.length > MAX_CAMPAIGN_NAME_LENGTH) {
    errors.name = `Keep it under ${MAX_CAMPAIGN_NAME_LENGTH} characters.`;
  }

  if (draft.source === "sheet") {
    if (!isGoogleSheetUrl(draft.sheetUrl)) {
      errors.sheetUrl =
        "Paste a Google Sheets link (https://docs.google.com/spreadsheets/…).";
    }
  } else if (draft.audienceSize <= 0) {
    errors.audience =
      draft.source === "csv"
        ? "Upload a CSV with at least one customer."
        : "Choose who to call.";
  }

  if (draft.sendMode === "later") {
    if (!draft.date) errors.date = "Pick a date.";
    else if (draft.date < today) errors.date = "Pick today or a later date.";
  }

  return errors;
}
