"use client";

import { useSyncExternalStore } from "react";

export type PdfViewMode = "scroll" | "single" | "spread";

const STORAGE_KEY = "kls-pdf-view-mode";
/** Scroll is the default way to read (owner's choice); a member's own choice is remembered. */
const DEFAULT_MODE: PdfViewMode = "scroll";
const listeners = new Set<() => void>();

function readMode(): PdfViewMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "spread" || stored === "single" || stored === "scroll" ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/**
 * The reader's view mode (scroll / single page / two-page spread), a purely
 * personal preference kept in this browser's localStorage. Read through
 * useSyncExternalStore so the saved choice is used from the first paint in
 * the browser (no flash of the default) and every open reader stays in sync.
 */
export function usePdfViewMode(): [PdfViewMode, (mode: PdfViewMode) => void] {
  const mode = useSyncExternalStore(
    (onChange) => { listeners.add(onChange); return () => { listeners.delete(onChange); }; },
    readMode,
    () => DEFAULT_MODE,
  );
  const update = (next: PdfViewMode) => {
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* private window: the choice just isn't remembered */ }
    listeners.forEach((l) => l());
  };
  return [mode, update];
}
