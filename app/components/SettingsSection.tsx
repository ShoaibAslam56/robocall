import type { ReactNode } from "react";

import { Annotated } from "./Annotated";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

// One settings card: title and a short explanation on top, the fields
// below. Same "annotated" pattern as Reviews Junction and Loyalty.
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <s-section>
      <Annotated title={title} description={description}>
        {children}
      </Annotated>
    </s-section>
  );
}
