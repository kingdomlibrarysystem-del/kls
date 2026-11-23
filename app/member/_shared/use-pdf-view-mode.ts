"use client";

import { useEffect, useState } from "react";

export type PdfViewMode = "scroll" | "single" | "spread";

/** Every book opens in Scroll view (owner's choice). */
const DEFAULT_MODE: PdfViewMode = "scroll";
/** Older versions remembered the last choice here; it is removed so no one is stuck in another view. */
const OLD_STORAGE_KEY = "kls-pdf-view-mode";

/**
 * The reader's view mode (scroll / single page / two-page spread). Each book
 * opens in Scroll; switching applies while that book stays open and is not
 * remembered for the next one.
 */
export function usePdfViewMode(): [PdfViewMode, (mode: PdfViewMode) => void] {
  const [mode, setMode] = useState<PdfViewMode>(DEFAULT_MODE);
  useEffect(() => {
    try { window.localStorage.removeItem(OLD_STORAGE_KEY); } catch { /* storage blocked: nothing to clean */ }
  }, []);
  return [mode, setMode];
}
