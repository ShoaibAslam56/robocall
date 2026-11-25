import type { ReactNode } from "react";

interface AppPageProps {
  heading: string;
  children: ReactNode;
  /** One <s-button variant="primary">. Shown top-right in the admin title bar. */
  primaryAction?: ReactNode;
  /** Extra <s-button>s next to the primary action. */
  secondaryActions?: ReactNode;
  /** Parent page, e.g. { label: "Call logs", href: "/app/calls" }. */
  breadcrumb?: { label: string; href: string };
}

// Every screen uses this wrapper. Page width comes from .pk-layout (same
// gutters as Reviews Junction and Loyalty), and sections are spaced with
// .pk-stack--loose (1rem), the same rhythm those apps use.
//
// Header buttons must be *direct* children of <s-page> to land in their
// slots, which is why they're props and not part of `children`.
export function AppPage({
  heading,
  children,
  primaryAction,
  secondaryActions,
  breadcrumb,
}: AppPageProps) {
  return (
    <s-page heading={heading} inlineSize="large">
      {breadcrumb ? (
        <s-link slot="breadcrumb-actions" href={breadcrumb.href}>
          {breadcrumb.label}
        </s-link>
      ) : null}
      {primaryAction}
      {secondaryActions}
      <div className="pk-stack pk-stack--loose">{children}</div>
    </s-page>
  );
}
