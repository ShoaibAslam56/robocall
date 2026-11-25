import type { LinksFunction } from "react-router";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import pakkaStyles from "./styles/pakka.css?url";

// One stylesheet for the whole app, same as Reviews Junction and Loyalty.
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: pakkaStyles },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
