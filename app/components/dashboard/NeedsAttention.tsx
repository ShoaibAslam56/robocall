import type { AttentionCounts } from "../../utils/stats";
import { formatNumber } from "../../utils/format";
import type { IconName } from "../types";

interface AttentionItem {
  key: keyof AttentionCounts;
  icon: IconName;
  /** Title for the row, given how many orders it covers. */
  title: (count: string, isOne: boolean) => string;
  hint: string;
  cta: string;
  href: string;
}

// Each row deep-links into Call logs with the matching filter already set.
const ITEMS: readonly AttentionItem[] = [
  {
    key: "callback",
    icon: "phone-in",
    title: (n, one) => `${n} ${one ? "customer wants" : "customers want"} a call-back`,
    hint: "They pressed 3. Call them yourself.",
    cta: "Call list",
    href: "/app/calls?status=callback",
  },
  {
    key: "unreachable",
    icon: "phone-out",
    title: (n, one) => `${n} ${one ? "order" : "orders"} didn't answer any retry`,
    hint: "Confirm on WhatsApp or hold the order.",
    cta: "Review",
    href: "/app/calls?status=no_answer",
  },
  {
    key: "incompleteAddress",
    icon: "location",
    title: (n, one) => `${n} ${one ? "order has" : "orders have"} an incomplete address`,
    hint: "The courier may not find them.",
    cta: "Review",
    href: "/app/calls?address=incomplete",
  },
  {
    key: "duplicate",
    icon: "duplicate",
    title: (n, one) => `${n} duplicate ${one ? "order" : "orders"}`,
    hint: "Same phone and address within 30 minutes.",
    cta: "Review",
    href: "/app/calls?skip=duplicate",
  },
  {
    key: "invalidNumber",
    icon: "alert-triangle",
    title: (n, one) => `${n} invalid phone ${one ? "number" : "numbers"}`,
    hint: "We couldn't call these.",
    cta: "Review",
    href: "/app/calls?skip=invalid_number",
  },
];

interface NeedsAttentionProps {
  counts: AttentionCounts;
  /** e.g. "Last 7 days", so merchants know which orders are counted. */
  periodLabel: string;
}

// Only shows problems that actually exist. A list of zeros is noise.
export function NeedsAttention({ counts, periodLabel }: NeedsAttentionProps) {
  const open = ITEMS.filter((item) => counts[item.key] > 0);

  return (
    <div className="pk-card">
      <div className="pk-cardhead">
        <div className="pk-cardhead__text">
          <s-heading>Needs your attention</s-heading>
          <s-paragraph color="subdued">{`Orders from the ${periodLabel.toLowerCase()}`}</s-paragraph>
        </div>
      </div>
      {open.length === 0 ? (
        <s-paragraph color="subdued">Nothing needs you right now.</s-paragraph>
      ) : (
        <div className="pk-list">
          {open.map((item) => {
            const count = counts[item.key];
            return (
              <div key={item.key} className="pk-list__row">
                <span className="pk-icon-tile" aria-hidden="true">
                  <s-icon type={item.icon} />
                </span>
                <div className="pk-grow">
                  <div className="pk-list__title">{item.title(formatNumber(count), count === 1)}</div>
                  <div className="pk-list__meta">{item.hint}</div>
                </div>
                <s-button href={item.href}>{item.cta}</s-button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
