import { useEffect, useRef, useState } from "react";

export interface Size {
  width: number;
  height: number;
}

// Tracks an element's rendered size. Starts at `fallback` (also what the
// server renders), then updates in the browser whenever the element is
// resized: window resize, a sibling card growing, and so on.
export function useElementSize<T extends HTMLElement>(fallback: Size) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return; // hidden or not laid out yet
      const next = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      // Skip identical sizes so we don't re-render for nothing.
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
