'use client'

import { sendSessionReaction } from './use-session-reactions'
import type { LiveKitDataMessage } from './use-livekit-room'

interface ReactionBarProps {
  sessionId: string
  senderName: string
  /** Broadcasts the reaction over LiveKit's real-time data channel so every other real participant's browser actually receives it — undefined when not connected to a real room (local-only, matches the previous mock behavior). */
  sendLiveKitData?: (message: LiveKitDataMessage) => void
}

const QUICK_REACTIONS = ['👍', '🎉', '❤️', '😂', '👏', '🙌']

/**
 * Quick-reaction buttons — sends a real, transient reaction into the
 * shared room-scoped store (own immediate feedback) and, when connected
 * to a real LiveKit room, broadcasts it to every other participant too.
 * Sits on the same always-dark floating chrome as ControlBar (see
 * session-room-view.tsx), so its background/border are fixed rather
 * than theme-variable.
 */
export function ReactionBar({ sessionId, senderName, sendLiveKitData }: ReactionBarProps) {
  const react = (emoji: string) => {
    const reaction = sendSessionReaction(sessionId, senderName, emoji)
    sendLiveKitData?.({ kind: 'reaction', id: reaction.id, emoji, senderName })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '2px 0' }}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          aria-label={`React with ${emoji}`}
          style={{
            width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.12)', fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
