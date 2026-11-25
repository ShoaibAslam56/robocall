import type { FormEvent, ReactNode } from "react";

import { useDemoToast } from "../hooks/useDemoToast";

interface SettingsFormProps {
  children: ReactNode;
}

// `data-save-bar` tells App Bridge to show Shopify's own Save / Discard bar
// at the top of the admin as soon as any field in this form changes. So
// every settings tab saves the same way, and merchants can't leave with
// unsaved changes by accident.
//
// There's no backend yet, so Save only shows a toast. Later this becomes a
// React Router `action` that validates and stores the settings.
export function SettingsForm({ children }: SettingsFormProps) {
  const showDemoToast = useDemoToast();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showDemoToast("settings aren't saved yet");
  };

  return (
    <form data-save-bar onSubmit={handleSubmit}>
      <div className="pk-stack pk-stack--loose">{children}</div>
    </form>
  );
}
