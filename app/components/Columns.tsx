import type { ReactNode } from "react";

interface ColumnsProps {
  /** Main content (left, wider). */
  main: ReactNode;
  /** Supporting content (right, narrower). Moves below `main` on small screens. */
  aside: ReactNode;
}

// Main + side column (see .pk-columns). Polaris' own slot="aside" only
// works at "base" page width, so wide pages use this instead.
export function Columns({ main, aside }: ColumnsProps) {
  return (
    <div className="pk-columns">
      <div className="pk-stack pk-stack--loose">{main}</div>
      <div className="pk-stack pk-stack--loose">{aside}</div>
    </div>
  );
}
