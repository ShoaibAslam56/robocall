import { useState } from "react";

import type { SetupStep } from "../../types/robocall";

interface SetupGuideProps {
  steps: readonly SetupStep[];
}

// Compact setup checklist: one row per step, the next step's button is
// primary. Uses the same list rows as the rest of the app (.pk-list).
// It disappears once every step is done.
export function SetupGuide({ steps }: SetupGuideProps) {
  const [isHidden, setIsHidden] = useState(false);
  const nextStep = steps.find((s) => !s.done);
  if (isHidden || !nextStep) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="pk-card">
      <div className="pk-cardhead">
        <div className="pk-cardhead__text">
          <s-heading>Finish setting up Pakka</s-heading>
          <s-paragraph color="subdued">
            {`${doneCount} of ${steps.length} steps done`}
          </s-paragraph>
        </div>
        <s-button
          variant="tertiary"
          icon="x"
          accessibilityLabel="Hide setup guide"
          onClick={() => setIsHidden(true)}
        />
      </div>

      <div
        className="pk-bar"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <div className="pk-bar__fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="pk-list" style={{ marginTop: 12 }}>
        {steps.map((step) => (
          <div
            key={step.id}
            className={`pk-list__row${step.done ? " is-done" : ""}`}
          >
            <s-icon
              type={step.done ? "check-circle-filled" : "circle-dashed"}
              tone={step.done ? "success" : "neutral"}
            />
            <div className="pk-grow">
              <div className="pk-list__title">{step.title}</div>
              {step.done ? null : (
                <div className="pk-list__meta">{step.description}</div>
              )}
            </div>
            {step.done ? null : (
              <div className="pk-list__aside">
                <s-button
                  variant={step.id === nextStep.id ? "primary" : "secondary"}
                  href={step.href}
                >
                  {step.actionLabel}
                </s-button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
