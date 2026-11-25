import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getSettings, listVoices } from "../data/robocall.server";
import { SettingsForm } from "../components/SettingsForm";
import { SettingsSection } from "../components/SettingsSection";
import { FieldRow } from "../components/FieldRow";
import { Select } from "../components/Select";
import { useDemoToast } from "../hooks/useDemoToast";
import { readValues, useDomEvent } from "../hooks/useDomEvent";
import type { BreakHour } from "../types/robocall";
import { formatTimeLabel, timeSlots } from "../utils/time";

const RETRY_OPTIONS = [0, 5, 10, 15, 30, 60] as const;
const FIRST_CALL_DELAYS = [0, 2, 5, 10, 15] as const;
const MAX_BREAKS = 5;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const [settings, voices] = await Promise.all([getSettings(), listVoices()]);
  return { calling: settings.calling, voices };
};

export default function CallingSettings() {
  const { calling, voices } = useLoaderData<typeof loader>();
  const showDemoToast = useDemoToast();
  const [windowMode, setWindowMode] = useState(calling.callingWindow);
  const [breaks, setBreaks] = useState<BreakHour[]>(calling.breakHours);
  const allSlots = timeSlots();

  const uploadRef = useDomEvent("change", () =>
    showDemoToast("recordings can't be uploaded yet"),
  );
  const windowRef = useDomEvent("change", (e) =>
    setWindowMode(readValues(e)[0] === "always" ? "always" : "custom"),
  );

  // Immutable list updates: always build a new array, never push/splice.
  const addBreak = () =>
    setBreaks((list) => [
      ...list,
      {
        id: `break-${Date.now()}`,
        label: "New break",
        start: "13:00",
        end: "14:00",
      },
    ]);
  const removeBreak = (id: string) =>
    setBreaks((list) => list.filter((b) => b.id !== id));

  return (
    <SettingsForm>
      <SettingsSection
        title="Default voice"
        description="The recording customers hear when we call to confirm an order. Urdu voices get the best answer rates in Pakistan."
      >
        <s-stack direction="block" gap="small">
          <s-choice-list
            name="defaultVoiceId"
            label="Voice"
            labelAccessibilityVisibility="exclusive"
          >
            {voices.map((voice) => (
              <s-choice
                key={voice.id}
                value={voice.id}
                selected={voice.id === calling.defaultVoiceId || undefined}
              >
                {voice.name}
                <s-text slot="details">
                  {`${voice.kind === "custom" ? "Your recording" : "Ready-made"} · ${voice.durationSeconds}s`}
                </s-text>
              </s-choice>
            ))}
          </s-choice-list>
          <s-drop-zone
            ref={uploadRef}
            label="Upload your own recording"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            accessibilityLabel="Upload an MP3 or WAV recording"
          />
          <s-text color="subdued">
            MP3 or WAV, under 45 seconds. Say your store name and the keypad
            options.
          </s-text>
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Keypad options"
        description="What customers can press after hearing the message."
      >
        <s-choice-list
          name="ivrOptions"
          label="Keypad options"
          labelAccessibilityVisibility="exclusive"
        >
          <s-choice value="2" selected={calling.ivrOptions === 2 || undefined}>
            1 to confirm, 2 to cancel
          </s-choice>
          <s-choice value="3" selected={calling.ivrOptions === 3 || undefined}>
            Also 3 to request a call-back
            <s-text slot="details">
              Call-back requests show up on the Dashboard under “Needs your
              attention”.
            </s-text>
          </s-choice>
        </s-choice-list>
      </SettingsSection>

      <SettingsSection
        title="Calling hours"
        description="Orders placed outside these hours are called when the window opens."
      >
        <s-stack direction="block" gap="small">
          <s-choice-list
            ref={windowRef}
            name="callingWindow"
            label="Calling window"
            labelAccessibilityVisibility="exclusive"
          >
            <s-choice
              value="always"
              selected={calling.callingWindow === "always" || undefined}
            >
              Any time, 24/7
            </s-choice>
            <s-choice
              value="custom"
              selected={calling.callingWindow === "custom" || undefined}
            >
              Only during set hours
            </s-choice>
          </s-choice-list>
          {windowMode === "custom" ? (
            <FieldRow>
              <TimeSelect
                name="callingHoursStart"
                label="From"
                value={calling.callingHoursStart}
                slots={allSlots}
              />
              <TimeSelect
                name="callingHoursEnd"
                label="Until"
                value={calling.callingHoursEnd}
                slots={allSlots}
              />
            </FieldRow>
          ) : null}
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Break hours"
        description="No calls or retries during these times, e.g. Jummah prayers or iftar. Calls wait until the break ends."
      >
        <s-stack direction="block" gap="small">
          {breaks.length === 0 ? (
            <s-text color="subdued">No breaks set.</s-text>
          ) : null}
          {breaks.map((item) => (
            <FieldRow key={item.id} template="2fr 1fr 1fr auto">
              <s-text-field
                name={`break-${item.id}-label`}
                label="Name"
                value={item.label}
              />
              <TimeSelect
                name={`break-${item.id}-start`}
                label="From"
                value={item.start}
                slots={allSlots}
              />
              <TimeSelect
                name={`break-${item.id}-end`}
                label="Until"
                value={item.end}
                slots={allSlots}
              />
              <s-button
                variant="tertiary"
                icon="delete"
                accessibilityLabel={`Remove ${item.label}`}
                onClick={() => removeBreak(item.id)}
              />
            </FieldRow>
          ))}
          <s-stack direction="inline">
            <s-button
              icon="plus"
              onClick={addBreak}
              disabled={breaks.length >= MAX_BREAKS || undefined}
            >
              Add break
            </s-button>
          </s-stack>
        </s-stack>
      </SettingsSection>

      <SettingsSection
        title="Retries"
        description="If nobody answers, we try again. Retries are free. You only pay for answered calls."
      >
        <s-stack direction="block" gap="small">
          <Select
            name="firstCallDelayMinutes"
            label="First call"
            value={String(calling.firstCallDelayMinutes)}
            options={FIRST_CALL_DELAYS.map((m) => ({
              value: String(m),
              label:
                m === 0
                  ? "Right after the order"
                  : `${m} minutes after the order`,
            }))}
          />
          <FieldRow columns={3}>
            {[0, 1, 2].map((index) => (
              <Select
                key={index}
                name={`retry${index + 1}`}
                label={`Retry ${index + 1}`}
                value={String(calling.retryIntervalsMinutes[index] ?? 0)}
                options={RETRY_OPTIONS.map((m) => ({
                  value: String(m),
                  label: m === 0 ? "Off" : `${m} min later`,
                }))}
              />
            ))}
          </FieldRow>
        </s-stack>
      </SettingsSection>
    </SettingsForm>
  );
}

interface TimeSelectProps {
  name: string;
  label: string;
  value: string;
  slots: readonly string[];
}

function TimeSelect({ name, label, value, slots }: TimeSelectProps) {
  return (
    <Select
      name={name}
      label={label}
      value={value}
      options={slots.map((slot) => ({
        value: slot,
        label: formatTimeLabel(slot),
      }))}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
