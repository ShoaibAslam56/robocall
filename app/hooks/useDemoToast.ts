import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

// There's no backend yet, so buttons that would save or send something
// show this toast instead. Search for useDemoToast to find every spot that
// needs a real action later.
export function useDemoToast(): (what: string) => void {
  const shopify = useAppBridge();
  return useCallback(
    (what: string) => shopify.toast.show(`Demo mode: ${what}`),
    [shopify],
  );
}
