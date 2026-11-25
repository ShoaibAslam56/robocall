import { Link, useLocation } from "react-router";

export const SETTINGS_TABS = [
  { label: "General", href: "/app/settings" },
  { label: "Voice & calling hours", href: "/app/settings/calling" },
  { label: "Automation & tags", href: "/app/settings/automation" },
  { label: "Order protection", href: "/app/settings/protection" },
] as const;

const withoutTrailingSlash = (path: string) => path.replace(/\/+$/, "");

// Same tab strip as Reviews Junction and Loyalty (see .pk-tabs). Each tab
// is its own URL, so the back button and deep links (e.g. from the setup
// guide) work. aria-current tells screen readers which one is selected.
export function SettingsTabs() {
  const { pathname, search } = useLocation();
  const current = withoutTrailingSlash(pathname);

  return (
    <nav className="pk-tabs" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => {
        const isActive = current === tab.href;
        return (
          <Link
            key={tab.href}
            // Keep the query string: in the embedded admin it carries
            // shop/host info that App Bridge needs.
            to={{ pathname: tab.href, search }}
            className={`pk-tabs__tab${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            preventScrollReset
            prefetch="intent"
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
