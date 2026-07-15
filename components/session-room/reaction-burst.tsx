'use client'

import { useEffect } from 'react'
import { useSessionReaction, clearSessionReaction } from './use-session-reactions'

/** Simulated on-screen lifetime of a reaction burst before it clears itself, matching Meet's brief floating-emoji duration. */
const BURST_DURATION_MS = 2000

/**
 * Ambient floating reaction, absolutely positioned over the video grid —
 * real state from use-session-reactions.ts, not a decorative animation
 * with nothing behind it. Auto-clears the shared store after
 * BURST_DURATION_MS so the next reaction (from either party) can show.
 */
export function ReactionBurst() {
  const reaction = useSessionReaction()

  useEffect(() => {
    if (!reaction) return
    const timer = setTimeout(() => clearSessionReaction(), BURST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [reaction])

  if (!reaction) return null

  return (
    <div
      key={reaction.id}
      style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none', zIndex: 10,
      }}
      aria-live="polite"
    >
      <span style={{ fontSize: 48 }}>{reaction.emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 10px', borderRadius: 10 }}>
        {reaction.senderName}
      </span>
    </div>
  )
}
