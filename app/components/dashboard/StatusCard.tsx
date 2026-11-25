import type { ReactNode } from "react";

import type { BadgeTone } from "../../utils/format";
import type { IconName } from "../types";

interface StatusCardProps {
  icon: IconName;
  title: string;
  badge: { tone: BadgeTone; label: string };
  body: string;
  action: ReactNode;
}

// "Is this part of the app working?" at a glance. Same card as the
// status cards on the Loyalty app's Home.
export function StatusCard({ icon, title, badge, body, action }: StatusCardProps) {
  return (
    <div className="pk-tile pk-statuscard">
      <div className="pk-row pk-row--between">
        <span className="pk-row">
          <span className="pk-icon-tile pk-icon-tile--muted" aria-hidden="true">
            <s-icon type={icon} />
          </span>
          <span className="pk-tile__title">{title}</span>
        </span>
        <s-badge tone={badge.tone}>{badge.label}</s-badge>
      </div>
      <p className="pk-tile__body">{body}</p>
      <div className="pk-tile__foot">
        <span style={{ marginLeft: "auto" }}>{action}</span>
      </div>
    </div>
  );
}
