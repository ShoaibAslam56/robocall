import type { ReactNode } from "react";

import type { IconName } from "./types";

interface EmptyStateProps {
  icon: IconName;
  heading: string;
  children: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  heading,
  children,
  action,
}: EmptyStateProps) {
  return (
    <div className="pk-empty">
      <s-icon type={icon} tone="neutral" />
      <s-text type="strong">{heading}</s-text>
      <s-paragraph color="subdued">{children}</s-paragraph>
      {action}
    </div>
  );
}
