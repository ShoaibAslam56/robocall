import type { ReactNode } from "react";

interface NoticeProps {
  tone?: "info" | "warning" | "success" | "critical";
  heading: string;
  /** Button(s) shown to the right of the text (below it on narrow screens). */
  action?: ReactNode;
  children?: ReactNode;
  isDismissible?: boolean;
}

// The app's one banner shape: action beside the text, not under it.
// Same as the Notice in Reviews Junction and Loyalty (see .pk-banner).
export function Notice({
  tone = "info",
  heading,
  action,
  children,
  isDismissible = false,
}: NoticeProps) {
  return (
    <s-banner
      tone={tone}
      heading={heading}
      dismissible={isDismissible || undefined}
    >
      <div className="pk-banner">
        <s-paragraph>{children}</s-paragraph>
        {action ? <div>{action}</div> : null}
      </div>
    </s-banner>
  );
}
