# Pakka call notice (Thank you page)

A small banner on the **Thank you page**, right after a customer orders:

> **We'll call you to confirm your order**
> Lorial PK will call you in a few minutes to confirm your order. Please pick up and press 1 to confirm.

**Why:** many customers ignore calls from unknown numbers. Telling them the
call is coming means more of them pick up, so fewer orders end up "No answer".

## How it works

- Target: `purchase.thank-you.block.render` (Thank you page only).
- No backend and no network access. It only shows text.
- Merchants add it in **Settings → Checkout → Customize → Thank you page → Add app block → Pakka call notice**.
- Merchants can change the heading and message there. Left empty, the defaults
  in `locales/en.default.json` are used, with the store name filled in.

## Files

| File | What it is |
| --- | --- |
| `shopify.extension.toml` | Where it renders and the editable settings |
| `src/ThankYouNotice.jsx` | The banner (Preact + Polaris web components) |
| `locales/en.default.json` | Default text |
| `shopify.d.ts` | Generated types for the `shopify` global |

## Check it

```bash
npx tsc -p extensions/thank-you-notice/tsconfig.json   # type check
shopify app build                                       # compile
shopify app dev                                         # preview in a dev store
```
