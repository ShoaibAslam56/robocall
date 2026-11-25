import type { CSSProperties, ReactNode } from "react";

interface FieldRowProps {
  children: ReactNode;
  /** How many equal columns. Collapses to one column on phones. */
  columns?: 2 | 3 | 4;
  /** Custom CSS grid template instead, e.g. "2fr 1fr 1fr auto". */
  template?: string;
}

// Puts form fields side by side (see .pk-grid). Polaris fields fill their
// full width, so an inline <s-stack> would just wrap them onto new lines.
export function FieldRow({ children, columns = 2, template }: FieldRowProps) {
  if (template) {
    const style = { "--pk-columns": template } as CSSProperties;
    return (
      <div className="pk-grid pk-grid--custom" style={style}>
        {children}
      </div>
    );
  }
  return <div className={`pk-grid pk-grid--${columns}`}>{children}</div>;
}
