'use client'

import { useState, useEffect } from 'react'

export type PdfViewMode = 'scroll' | 'single' | 'spread'

const STORAGE_KEY = 'kls-pdf-view-mode'

/**
 * Purely a client-side reading preference (which of the 3 view modes the
 * PDF reader renders in) — no server persistence exists anywhere yet for
 * reader UI preferences (confirmed: no precedent in lib/ or elsewhere), so
 * this uses localStorage directly rather than inventing a new API/schema
 * field for a one-person, purely cosmetic setting.
 */
export function usePdfViewMode(): [PdfViewMode, (mode: PdfViewMode) => void] {
  const [mode, setMode] = useState<PdfViewMode>('scroll')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'scroll' || stored === 'single' || stored === 'spread') setMode(stored)
  }, [])

  const update = (next: PdfViewMode) => {
    setMode(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return [mode, update]
}
