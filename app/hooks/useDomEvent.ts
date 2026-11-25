import { useCallback, useEffect, useRef } from "react";

// Why this hook exists:
// Polaris web components (<s-select>, <s-text-field>, …) are custom
// elements. React 18 only wires up events it knows for built-in elements,
// so `onChange` on <s-select> silently does nothing. (`onClick` works only
// because "click" is a normal bubbling DOM event.) React 19 fixes this, but
// the Shopify template is on React 18.
//
// The fix: attach a real DOM listener ourselves. We return a *callback ref*
// instead of useRef + useEffect, so it also works for elements that appear
// later (conditionally rendered fields).
//
// Usage:
//   const ref = useDomEvent("change", (e) => setCity(readValue(e)));
//   <s-select ref={ref} ...>

export function useDomEvent<E extends Event = Event>(
  eventName: string,
  handler: (event: E) => void,
): (element: HTMLElement | null) => void {
  // Keep the latest handler without re-attaching the listener every render.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback(
    (element: HTMLElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!element) return;

      const listener = (event: Event) => handlerRef.current(event as E);
      element.addEventListener(eventName, listener);
      cleanupRef.current = () =>
        element.removeEventListener(eventName, listener);
    },
    [eventName],
  );
}

/** Current value of the Polaris field that fired the event. */
export function readValue(event: Event): string {
  const target = event.currentTarget as { value?: unknown } | null;
  return typeof target?.value === "string" ? target.value : "";
}

/** Selected values of an <s-choice-list> that fired the event. */
export function readValues(event: Event): string[] {
  const target = event.currentTarget as { values?: unknown } | null;
  return Array.isArray(target?.values)
    ? target.values.filter((v): v is string => typeof v === "string")
    : [];
}

/** Checked state of an <s-checkbox> / <s-switch> that fired the event. */
export function readChecked(event: Event): boolean {
  const target = event.currentTarget as { checked?: unknown } | null;
  return target?.checked === true;
}

/** Files chosen in an <s-drop-zone> that fired the event. */
export function readFiles(event: Event): File[] {
  const target = event.currentTarget as { files?: unknown } | null;
  return Array.isArray(target?.files)
    ? target.files.filter((f): f is File => f instanceof File)
    : [];
}
