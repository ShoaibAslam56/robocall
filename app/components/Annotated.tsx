import type { ReactNode } from "react";

interface AnnotatedProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/** Explanation on top, the thing it explains below. Several in one
 *  <s-section> get a divider between them. Same as Annotated in
 *  Reviews Junction and Loyalty (see .pk-annotated). */
export function Annotated({ title, description, children }: AnnotatedProps) {
  return (
    <section className="pk-annotated">
      <div className="pk-annotated__intro">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="pk-stack">{children}</div>
    </section>
  );
}
