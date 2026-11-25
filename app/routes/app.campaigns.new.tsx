import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import {
  getSettings,
  getShop,
  listPlans,
  listSegments,
  listVoices,
} from "../data/robocall.server";
import { Annotated } from "../components/Annotated";
import { AppPage } from "../components/AppPage";
import { Columns } from "../components/Columns";
import { Notice } from "../components/Notice";
import { FieldRow } from "../components/FieldRow";
import { Select } from "../components/Select";
import { useDemoToast } from "../hooks/useDemoToast";
import {
  readFiles,
  readValue,
  readValues,
  useDomEvent,
} from "../hooks/useDomEvent";
import type { AudienceSource } from "../types/robocall";
import {
  validateCampaign,
  type CampaignDraft,
  type CampaignErrors,
} from "../utils/campaign";
import { countCsvRows } from "../utils/csv";
import { formatDayKey, formatNumber, formatUsd } from "../utils/format";
import { estimateCampaignCost, pulsesFor } from "../utils/pricing";
import { formatTimeLabel, timeSlots } from "../utils/time";

// Typical answer rate for marketing calls. Only used for the estimate.
const EXPECTED_ANSWER_RATE = 65;
const CAMPAIGN_PLAN_ID = "scale";
const NO_SEGMENT = "none";

// Which error message belongs to which draft field.
const FIELD_ERRORS: Partial<Record<keyof CampaignDraft, keyof CampaignErrors>> =
  {
    name: "name",
    source: "audience",
    audienceSize: "audience",
    sheetUrl: "sheetUrl",
    date: "date",
  };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [shop, segments, voices, plans, settings] = await Promise.all([
    getShop(),
    listSegments(),
    listVoices(),
    listPlans(),
    getSettings(),
  ]);
  const currentPlan =
    plans.find((p) => p.id === shop.subscription.planId) ?? plans[0];

  return {
    today: shop.today,
    segments,
    voices,
    perPulseUsd: currentPlan.perPulseUsd,
    canSendCampaigns: currentPlan.id === CAMPAIGN_PLAN_ID,
    callingHours: {
      start: settings.calling.callingHoursStart,
      end: settings.calling.callingHoursEnd,
    },
  };
};

export default function NewCampaign() {
  const {
    today,
    segments,
    voices,
    perPulseUsd,
    canSendCampaigns,
    callingHours,
  } = useLoaderData<typeof loader>();
  const showDemoToast = useDemoToast();

  const [draft, setDraft] = useState<CampaignDraft>({
    name: "",
    source: "segment",
    audienceSize: 0,
    sheetUrl: "",
    sendMode: "now",
    date: today,
    time: callingHours.start,
  });
  const [segmentId, setSegmentId] = useState(NO_SEGMENT);
  const [csvFile, setCsvFile] = useState<{ name: string; rows: number } | null>(
    null,
  );
  const [voiceId, setVoiceId] = useState(voices[0]?.id ?? "");
  const [errors, setErrors] = useState<CampaignErrors>({});

  // Immutable update: copy the old draft and change one field.
  // Editing a field clears that field's error right away, so a fixed
  // mistake doesn't keep showing red until the next submit.
  const update = (patch: Partial<CampaignDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    const fixed = new Set(
      Object.keys(patch).map((key) => FIELD_ERRORS[key as keyof CampaignDraft]),
    );
    setErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(
          ([key]) => !fixed.has(key as keyof CampaignErrors),
        ),
      ),
    );
  };

  const nameRef = useDomEvent("input", (e) => update({ name: readValue(e) }));
  const sourceRef = useDomEvent("change", (e) => {
    const source = (readValues(e)[0] ?? "segment") as AudienceSource;
    const size =
      source === "segment"
        ? (segments.find((s) => s.id === segmentId)?.size ?? 0)
        : source === "csv"
          ? (csvFile?.rows ?? 0)
          : 0;
    update({ source, audienceSize: size });
  });
  const segmentRef = useDomEvent("change", (e) => {
    const id = readValue(e);
    setSegmentId(id);
    update({ audienceSize: segments.find((s) => s.id === id)?.size ?? 0 });
  });
  // Reading the file happens in the browser, so we can count rows before
  // anything is uploaded anywhere.
  const dropRef = useDomEvent("change", async (e) => {
    const file = readFiles(e)[0];
    if (!file) return;
    try {
      const rows = countCsvRows(await file.text());
      setCsvFile({ name: file.name, rows });
      update({ audienceSize: rows });
    } catch {
      setCsvFile(null);
      setErrors((prev) => ({
        ...prev,
        audience: "We couldn't read that file. Is it a .csv?",
      }));
    }
  });
  const sheetRef = useDomEvent("input", (e) =>
    update({ sheetUrl: readValue(e) }),
  );
  const voiceRef = useDomEvent("change", (e) => setVoiceId(readValue(e)));
  const sendModeRef = useDomEvent("change", (e) =>
    update({ sendMode: readValues(e)[0] === "later" ? "later" : "now" }),
  );
  const dateRef = useDomEvent("change", (e) => update({ date: readValue(e) }));
  const timeRef = useDomEvent("change", (e) => update({ time: readValue(e) }));

  const voice = voices.find((v) => v.id === voiceId) ?? voices[0];
  const estimate = estimateCampaignCost(
    draft.audienceSize,
    EXPECTED_ANSWER_RATE,
    voice?.durationSeconds ?? 30,
    perPulseUsd,
  );

  const submit = (mode: "draft" | "send") => {
    if (mode === "draft") {
      showDemoToast("draft would be saved");
      return;
    }
    const found = validateCampaign(draft, today);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    showDemoToast(
      draft.sendMode === "now"
        ? "campaign would start now"
        : "campaign would be scheduled",
    );
  };

  return (
    <AppPage
      heading="Create campaign"
      breadcrumb={{ label: "Campaigns", href: "/app/campaigns" }}
    >
      {canSendCampaigns ? null : (
        <Notice
          heading="Campaigns are part of the Scale plan"
          action={<s-button href="/app/plans">Compare plans</s-button>}
        >
          You can build and save this campaign now. Upgrade when you&apos;re
          ready to send it.
        </Notice>
      )}

      <Columns
        main={
          <>
            <s-section>
              <Annotated
                title="Campaign name"
                description="A name to find this campaign later. Only you see it."
              >
                <s-text-field
                  ref={nameRef}
                  label="Name"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="e.g. Winter sale early access"
                  error={errors.name}
                />
              </Annotated>

              <Annotated
                title="Who to call"
                description="A Shopify customer segment, a CSV upload, or a Google Sheet."
              >
                <s-stack direction="block" gap="small">
                  <s-choice-list
                    ref={sourceRef}
                    name="audienceSource"
                    label="Audience source"
                    labelAccessibilityVisibility="exclusive"
                  >
                    <s-choice value="segment" selected>
                      Shopify customer segment
                    </s-choice>
                    <s-choice value="csv">Upload a CSV</s-choice>
                    <s-choice value="sheet">Google Sheet</s-choice>
                  </s-choice-list>

                  {draft.source === "segment" ? (
                    <Select
                      ref={segmentRef}
                      label="Segment"
                      value={segmentId}
                      error={errors.audience}
                      options={[
                        { value: NO_SEGMENT, label: "Choose a segment" },
                        ...segments.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${formatNumber(s.size)})`,
                        })),
                      ]}
                    />
                  ) : null}

                  {draft.source === "csv" ? (
                    <s-stack direction="block" gap="small-200">
                      <s-drop-zone
                        ref={dropRef}
                        label="Customer list"
                        accept=".csv,text/csv"
                        accessibilityLabel="Upload a CSV of customers"
                        error={errors.audience}
                      />
                      <s-text color="subdued">
                        {csvFile
                          ? `${csvFile.name}: ${formatNumber(csvFile.rows)} customers`
                          : "Columns: name, phone. One customer per row."}
                      </s-text>
                    </s-stack>
                  ) : null}

                  {draft.source === "sheet" ? (
                    <s-url-field
                      ref={sheetRef}
                      label="Google Sheet link"
                      placeholder="https://docs.google.com/spreadsheets/…"
                      details="Share the sheet as “Anyone with the link can view”."
                      error={errors.sheetUrl}
                    />
                  ) : null}

                  <s-text color="subdued">
                    Only include customers who agreed to receive calls from your
                    store.
                  </s-text>
                </s-stack>
              </Annotated>

              <Annotated
                title="Message"
                description="The recording customers hear, and what they can press after it."
              >
                <s-stack direction="block" gap="small">
                  <Select
                    ref={voiceRef}
                    label="Recording"
                    value={voiceId}
                    options={voices.map((v) => ({
                      value: v.id,
                      label: `${v.name} · ${v.durationSeconds}s`,
                    }))}
                  />
                  <s-box
                    padding="base"
                    background="subdued"
                    borderRadius="base"
                  >
                    <s-stack direction="block" gap="small-200">
                      <s-text type="strong">
                        After the message, customers can press:
                      </s-text>
                      <s-text>
                        1: I&apos;m interested (tagged so you can follow up)
                      </s-text>
                      <s-text>2: Stop campaign calls (always included)</s-text>
                    </s-stack>
                  </s-box>
                  <s-link href="/app/settings/calling">
                    Upload a new recording
                  </s-link>
                </s-stack>
              </Annotated>

              <Annotated
                title="When to send"
                description="Start right away, or pick a date and time."
              >
                <s-stack direction="block" gap="small">
                  <s-choice-list
                    ref={sendModeRef}
                    name="sendMode"
                    label="Send time"
                    labelAccessibilityVisibility="exclusive"
                  >
                    <s-choice value="now" selected>
                      Start now
                    </s-choice>
                    <s-choice value="later">Schedule for later</s-choice>
                  </s-choice-list>

                  {draft.sendMode === "later" ? (
                    <FieldRow>
                      <s-date-field
                        ref={dateRef}
                        label="Date"
                        value={draft.date}
                        allow={`${today}--`}
                        error={errors.date}
                      />
                      <Select
                        ref={timeRef}
                        label="Start time"
                        value={draft.time}
                        options={timeSlots(
                          callingHours.start,
                          callingHours.end,
                        ).map((slot) => ({
                          value: slot,
                          label: formatTimeLabel(slot),
                        }))}
                      />
                    </FieldRow>
                  ) : null}

                  <s-text color="subdued">
                    {`Calls only go out between ${formatTimeLabel(callingHours.start)} and ${formatTimeLabel(callingHours.end)}, and pause during your break hours.`}
                  </s-text>
                </s-stack>
              </Annotated>
            </s-section>

            <s-stack direction="inline" gap="small" justifyContent="end">
              <s-button onClick={() => submit("draft")}>Save draft</s-button>
              <s-button variant="primary" onClick={() => submit("send")}>
                {draft.sendMode === "now"
                  ? "Start campaign"
                  : "Schedule campaign"}
              </s-button>
            </s-stack>
          </>
        }
        aside={
          <s-section heading="Summary">
            <s-stack direction="block" gap="small">
              <SummaryRow
                label="People to call"
                value={
                  draft.source === "sheet"
                    ? "Counted after linking"
                    : formatNumber(draft.audienceSize)
                }
              />
              <SummaryRow
                label={`Likely to answer (~${EXPECTED_ANSWER_RATE}%)`}
                value={formatNumber(estimate.answeredCalls)}
              />
              <SummaryRow
                label="Message length"
                value={
                  voice
                    ? `${voice.durationSeconds}s · ${pulsesFor(voice.durationSeconds)} pulse`
                    : "—"
                }
              />
              <SummaryRow
                label="When"
                value={
                  draft.sendMode === "now"
                    ? "Right away"
                    : `${formatDayKey(draft.date)}, ${formatTimeLabel(draft.time)}`
                }
              />
              <s-divider />
              <SummaryRow
                label="Estimated cost"
                value={formatUsd(estimate.totalUsd)}
                isStrong
              />
              <s-text color="subdued">
                {`You're only charged for answered calls: ${formatUsd(perPulseUsd)} per 30 seconds.`}
              </s-text>
            </s-stack>
          </s-section>
        }
      />
    </AppPage>
  );
}

function SummaryRow({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value: string;
  isStrong?: boolean;
}) {
  return (
    <s-stack direction="inline" justifyContent="space-between" gap="small">
      <s-text color="subdued">{label}</s-text>
      <s-text type={isStrong ? "strong" : "generic"}>{value}</s-text>
    </s-stack>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
