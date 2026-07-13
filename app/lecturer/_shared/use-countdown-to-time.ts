'use client'

import { useState, useEffect } from 'react'

/**
 * Derives a live "seconds remaining until targetIso" value, ticking every
 * second via setInterval — the one real-time polling loop this feature
 * needs (unlike every other store in this app, which updates purely via
 * useSyncExternalStore/emitChange, "time until a scheduled moment" has no
 * mutation event to subscribe to, so a clock tick is the honest mechanism).
 * Feeds `CountdownTimer` (app/member/assessments/.../countdown-timer.tsx),
 * reused as-is rather than building a second countdown primitive.
 */
export function useCountdownToTime(targetIso: string | undefined): number {
  const [secondsRemaining, setSecondsRemaining] = useState(() => secondsUntil(targetIso))

  useEffect(() => {
    setSecondsRemaining(secondsUntil(targetIso))
    if (!targetIso) return
    const interval = setInterval(() => setSecondsRemaining(secondsUntil(targetIso)), 1000)
    return () => clearInterval(interval)
  }, [targetIso])

  return secondsRemaining
}

function secondsUntil(targetIso: string | undefined): number {
  if (!targetIso) return 0
  const diff = Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000)
  return Math.max(0, diff)
}
