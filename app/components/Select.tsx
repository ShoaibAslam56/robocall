import { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: readonly SelectOption[];
  /** The option that starts selected. */
  value: string;
  name?: string;
  details?: string;
  error?: string;
  /** Hide the label visually (still read by screen readers). */
  isLabelHidden?: boolean;
}

// Why not just <s-select value="...">?
// The `value` attribute reaches <s-select> before its <s-option> children
// exist, so the component ignores it and shows the first option instead.
// Marking the matching <s-option selected> is the reliable, HTML-native way.
// Every select in the app goes through here so nobody hits that bug again.
//
// forwardRef lets callers pass a ref (e.g. from useDomEvent) through to the
// real <s-select> element. (React 19 won't need forwardRef for this.)
// The element class Polaris registers for <s-select>.
type SelectElement = HTMLElementTagNameMap["s-select"];

export const Select = forwardRef<SelectElement, SelectProps>(function Select(
  { label, options, value, name, details, error, isLabelHidden = false },
  ref,
) {
  return (
    <s-select
      ref={ref}
      label={label}
      name={name}
      details={details}
      error={error}
      labelAccessibilityVisibility={isLabelHidden ? "exclusive" : undefined}
    >
      {options.map((option) => (
        <s-option
          key={option.value}
          value={option.value}
          selected={option.value === value || undefined}
        >
          {option.label}
        </s-option>
      ))}
    </s-select>
  );
});
