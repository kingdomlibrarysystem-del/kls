'use client'

import { useEffect, useState } from 'react'
import { Hash, User, Plus } from 'lucide-react'
import type { Channel, Message } from './types'
import { unreadCountFor } from './use-messages'

interface ChannelListPanelProps {
  userId: string
  channels: Channel[]
  activeChannelId: string | null
  onSelect: (channel: Channel) => void
  onNewDm: () => void
}

/** Left pane: course channels + DM threads. Fetches each channel's own messages just to compute a real unread badge — small channel counts here (course/DM lists are never large) make this an acceptable per-render cost, matching this codebase's other list-plus-badge patterns. */
export function ChannelListPanel({ userId, channels, activeChannelId, onSelect, onNewDm }: ChannelListPanelProps) {
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all(channels.map((c) =>
      fetch(`/api/messages?channelId=${c.id}`).then((r) => r.json()).then((j) => [c.id, (j.data ?? []) as Message[]] as const)
    )).then((results) => {
      if (cancelled) return
      const counts: Record<string, number> = {}
      results.forEach(([id, messages]) => { counts[id] = unreadCountFor(id, messages, userId) })
      setUnreadByChannel(counts)
    })
    return () => { cancelled = true }
  }, [channels, userId])

  const courseChannels = channels.filter((c) => c.kind === 'course')
  const dmChannels = channels.filter((c) => c.kind === 'dm')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
        COURSE CHANNELS
      </div>
      <div style={{ overflowY: 'auto' }}>
        {courseChannels.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '10px 12px' }}>No course channels yet.</p>
        ) : (
          courseChannels.map((c) => (
            <ChannelRow key={c.id} channel={c} icon={<Hash size={13} />} active={c.id === activeChannelId} unread={unreadByChannel[c.id] ?? 0} onSelect={onSelect} />
          ))
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>DIRECT MESSAGES</span>
          <button
            onClick={onNewDm}
            aria-label="Start a new direct message"
            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Plus size={13} />
          </button>
        </div>

        {dmChannels.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '10px 12px' }}>No direct messages yet.</p>
        ) : (
          dmChannels.map((c) => (
            <ChannelRow key={c.id} channel={c} icon={<User size={13} />} active={c.id === activeChannelId} unread={unreadByChannel[c.id] ?? 0} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}

function ChannelRow({
  channel, icon, active, unread, onSelect,
}: { channel: Channel; icon: React.ReactNode; active: boolean; unread: number; onSelect: (c: Channel) => void }) {
  return (
    <button
      onClick={() => onSelect(channel)}
      aria-current={active}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', textAlign: 'left', cursor: 'pointer',
        background: active ? 'rgba(212,168,67,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-secondary)',
      }}
    >
      {icon}
      <span style={{ flex: 1, fontSize: 12, fontWeight: unread > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.name}</span>
      {unread > 0 && (
        <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {unread}
        </span>
      )}
    </button>
  )
}
