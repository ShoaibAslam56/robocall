import type { JSX } from "react";

// The icon names <s-icon type="..."> accepts, pulled from Polaris' own types
// so a typo like "phone-outt" fails the typecheck instead of rendering blank.
export type IconName = NonNullable<JSX.IntrinsicElements["s-icon"]["type"]>;
