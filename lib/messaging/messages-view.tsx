'use client'

import { useState } from 'react'
import { useChannelsFor } from './use-messages'
import { ChannelListPanel } from './channel-list-panel'
import { MessageThreadPanel } from './message-thread-panel'
import { NewDmModal } from './new-dm-modal'
import type { Channel } from './types'

interface MessagesViewProps {
  userId: string
}

/** Shared two-pane chat UI, reachable from /member/messages — backed by the real session user's id, real Channel/Message API. */
export function MessagesView({ userId }: MessagesViewProps) {
  const { data: channels, loading, refetch } = useChannelsFor(userId)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [newDmOpen, setNewDmOpen] = useState(false)

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null

  const handleSelect = (channel: Channel) => setActiveChannelId(channel.id)

  const handleStartDm = (otherUserId: string) => {
    setActiveChannelId(`pending-dm-${otherUserId}`)
  }

  if (loading) {
    return <div style={{ height: 'calc(100vh - 140px)' }} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3" style={{ height: 'calc(100vh - 140px)' }}>
      <ChannelListPanel
        userId={userId}
        channels={channels}
        activeChannelId={activeChannelId}
        onSelect={handleSelect}
        onNewDm={() => setNewDmOpen(true)}
      />
      <MessageThreadPanel
        channel={activeChannel}
        pendingDmUserId={activeChannelId?.startsWith('pending-dm-') ? activeChannelId.replace('pending-dm-', '') : null}
        userId={userId}
        onChannelCreated={(id) => { setActiveChannelId(id); refetch() }}
      />
      <NewDmModal open={newDmOpen} userId={userId} onClose={() => setNewDmOpen(false)} onSelect={handleStartDm} />
    </div>
  )
}
