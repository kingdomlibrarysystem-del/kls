'use client'

import { sendSessionReaction } from './use-session-reactions'

interface ReactionBarProps {
  sessionId: string
  senderName: string
}

const QUICK_REACTIONS = ['👍', '🎉', '❤️', '😂', '👏', '🙌']

/**
 * Quick-reaction buttons — sends a real, transient reaction into the
 * shared room-scoped store, ambient over the video grid via
 * ReactionBurst rather than posted as a chat message. Sits on the same
 * always-dark floating chrome as ControlBar (see session-room-view.tsx),
 * so its background/border are fixed rather than theme-variable.
 */
export function ReactionBar({ sessionId, senderName }: ReactionBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '2px 0' }}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendSessionReaction(sessionId, senderName, emoji)}
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
