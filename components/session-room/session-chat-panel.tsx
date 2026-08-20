'use client'

import { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { useSessionChat, sendSessionMessage } from './use-session-chat'
import type { LiveKitDataMessage } from './use-livekit-room'

interface SessionChatPanelProps {
  sessionId: string
  senderName: string
  /** Broadcasts the message over LiveKit's real-time data channel so every other real participant's browser actually receives it — undefined when not connected to a real room. */
  sendLiveKitData?: (message: LiveKitDataMessage) => void
}

/** Real, session-scoped chat: a message list backed by use-session-chat.ts's in-memory store, plus a working input that actually appends messages and (when connected) broadcasts them to real remote participants. */
export function SessionChatPanel({ sessionId, senderName, sendLiveKitData }: SessionChatPanelProps) {
  const messages = useSessionChat(sessionId)
  const [draft, setDraft] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    const message = sendSessionMessage(sessionId, senderName, draft.trim())
    sendLiveKitData?.({ kind: 'chat', id: message.id, senderName, body: message.body, sentAt: message.sentAt })
    setDraft('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageSquare size={13} color="var(--gold)" /> Session Chat
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 160 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{m.senderName}</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{m.body}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid var(--border)' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Type a session chat message"
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}
        />
        <button
          type="submit"
          aria-label="Send message"
          style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
