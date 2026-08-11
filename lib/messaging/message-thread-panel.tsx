'use client'

import { useState, useEffect } from 'react'
import { Send, Hash, User, Users } from 'lucide-react'
import { useMessages, sendMessage, markMessageRead } from './use-messages'
import { MessageBubble } from './message-bubble'
import type { Channel } from './types'

interface MessageThreadPanelProps {
  channel: Channel | null
  /** Set when the user picked a new DM target that has no channel yet — the channel is created lazily on first send. */
  pendingDmUserId: string | null
  userId: string
  onChannelCreated: (channelId: string) => void
}

/**
 * Right pane: message list (real send/receive, real reactions) plus a
 * member-count header for course channels.
 *
 * Out of scope for this phase (Phase 3-style honesty note, not a silent
 * omission): replying to a specific message (threading) and @mention
 * autocomplete. Every message here is flat within its channel.
 */
export function MessageThreadPanel({ channel, pendingDmUserId, userId, onChannelCreated }: MessageThreadPanelProps) {
  const { data: messages, loading, refetch } = useMessages(channel?.id ?? null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!channel) return
    messages.filter((m) => m.senderId !== userId && !m.readByIds.includes(userId)).forEach((m) => {
      markMessageRead(m.id, userId)
    })
  }, [channel, messages, userId])

  if (!channel && !pendingDmUserId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12 }}>
        Select a channel or direct message to start chatting.
      </div>
    )
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const created = await sendMessage({
        channelId: channel?.id,
        senderId: userId,
        body: draft.trim(),
        participantIds: !channel && pendingDmUserId ? [userId, pendingDmUserId] : undefined,
      })
      setDraft('')
      if (!channel) onChannelCreated(created.channelId)
      else refetch()
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {channel?.kind === 'course' ? <Hash size={14} color="var(--gold)" /> : <User size={14} color="var(--gold)" />}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{channel?.name ?? 'New Message'}</span>
        </div>
        {channel?.kind === 'course' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <Users size={12} /> {channel.participantIds.length} members
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? null : messages.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>No messages yet — say hello.</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} isYou={m.senderId === userId} userId={userId} onReacted={refetch} />)
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
          disabled={sending}
          style={{ width: 36, height: 36, borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.6 : 1 }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
