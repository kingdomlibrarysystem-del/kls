'use client'

import { useState, useEffect } from 'react'
import { Send, Hash, User, Users } from 'lucide-react'
import type { UserRole } from '@/contexts/auth-context'
import { useMessages, sendMessage, markChannelRead } from './use-messages'
import { MessageBubble } from './message-bubble'
import type { Channel } from './types'

interface MessageThreadPanelProps {
  channel: Channel | null
  personName: string
  personRole: UserRole
}

/**
 * Right pane: message list (real send/receive, real reactions) plus a
 * member-list header for course channels — derived from the channel's own
 * participantNames (enrollment + lecturerId), same "derive, don't
 * duplicate" principle as the rest of this store, not a separately
 * maintained roster.
 *
 * Out of scope for this phase (Phase 3-style honesty note, not a silent
 * omission): replying to a specific message (threading) and @mention
 * autocomplete. Every message here is flat within its channel.
 */
export function MessageThreadPanel({ channel, personName, personRole }: MessageThreadPanelProps) {
  const messages = useMessages(channel?.id ?? '__none__')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (channel) markChannelRead(channel.id, personName)
  }, [channel, personName, messages.length])

  if (!channel) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12 }}>
        Select a channel or direct message to start chatting.
      </div>
    )
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(channel.id, personName, personRole, draft.trim(), channel.participantNames)
    setDraft('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {channel.kind === 'course' ? <Hash size={14} color="var(--gold)" /> : <User size={14} color="var(--gold)" />}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{channel.name}</span>
        </div>
        {channel.kind === 'course' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <Users size={12} /> {channel.participantNames.join(', ')}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>No messages yet — say hello.</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} isYou={m.senderName === personName} personName={personName} />)
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid var(--border)' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Type a message"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
        />
        <button
          type="submit"
          aria-label="Send message"
          style={{ width: 36, height: 36, borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
