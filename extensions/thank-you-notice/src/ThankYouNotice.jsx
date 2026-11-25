import "@shopify/ui-extensions/preact";
import { render } from "preact";

// Shopify calls this when the Thank you page loads.
export default async () => {
  render(<ThankYouNotice />, document.body);
};

function ThankYouNotice() {
  // `settings` are the fields from shopify.extension.toml, filled in by the
  // merchant in the checkout editor. Empty means "use the default".
  const settings = shopify.settings.value;
  const storeName = shopify.shop?.name;

  const heading = textOrDefault(
    settings.heading,
    shopify.i18n.translate("defaultHeading"),
  );
  const message = textOrDefault(
    settings.message,
    storeName
      ? shopify.i18n.translate("defaultMessage", { store: storeName })
      : shopify.i18n.translate("defaultMessageNoStore"),
  );

  return (
    <s-banner heading={heading} tone="info">
      <s-text>{message}</s-text>
    </s-banner>
  );
}

/** Merchant text if they typed something, otherwise the default. */
function textOrDefault(value, fallback) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}
