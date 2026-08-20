'use client'

import { Activity, LogIn, LogOut, Hand, ScreenShare, ScreenShareOff, Smile } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { ActivityEntry } from './use-session-activity'

interface ActivityLogPanelProps {
  entries: ActivityEntry[]
}

const ICONS = {
  joined: LogIn,
  left: LogOut,
  'hand-raised': Hand,
  'hand-lowered': Hand,
  'presenting-started': ScreenShare,
  'presenting-stopped': ScreenShareOff,
  reacted: Smile,
} as const

const LABELS: Record<ActivityEntry['kind'], string> = {
  joined: 'joined the room',
  left: 'left the room',
  'hand-raised': 'raised their hand',
  'hand-lowered': 'lowered their hand',
  'presenting-started': 'started presenting',
  'presenting-stopped': 'stopped presenting',
  reacted: 'reacted',
}

/** Real in-room activity feed — genuine LiveKit join/leave events plus real hand-raise/presenting/reaction state changes, not a decorative log. */
export function ActivityLogPanel({ entries }: ActivityLogPanelProps) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={13} color="var(--gold)" /> Activity
      </div>
      <div style={{ padding: 8, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" description="Real events — joins, hand raises, reactions — will appear here." style={{ padding: '12px 8px', color: 'var(--text-secondary)' }} />
        ) : (
          [...entries].reverse().map((e) => {
            const Icon = ICONS[e.kind]
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11 }}>
                <Icon size={12} color="var(--gold)" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.actorName}</span> {LABELS[e.kind]}{e.detail ? ` ${e.detail}` : ''}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(e.at).toLocaleTimeString()}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
