'use client'

import { useState } from 'react'
import type { UserRole } from '@/contexts/auth-context'
import { useChannelsFor, useAllMessages, unreadCountFor, startDm } from './use-messages'
import { ChannelListPanel } from './channel-list-panel'
import { MessageThreadPanel } from './message-thread-panel'
import { NewDmModal } from './new-dm-modal'
import type { Channel } from './types'

interface MessagesViewProps {
  personName: string
  personRole: UserRole
}

/**
 * Shared two-pane chat UI — one component reachable from both
 * /member/messages and /lecturer/messages (the same "one shared
 * component, parameterized by role" pattern Phase 3's SessionCard/
 * SessionRoomView already established), since the real content is
 * identical modulo which persona is "you."
 */
export function MessagesView({ personName, personRole }: MessagesViewProps) {
  const channels = useChannelsFor(personName)
  const allMessages = useAllMessages()
  const [activeChannelId, setActiveChannelId] = useState<string | null>(channels[0]?.id ?? null)
  const [newDmOpen, setNewDmOpen] = useState(false)

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null

  const unreadFor = (channelId: string) => unreadCountFor(channelId, allMessages, personName)

  const handleSelect = (channel: Channel) => setActiveChannelId(channel.id)

  const handleStartDm = (otherName: string) => {
    const channel = startDm(personName, otherName)
    setActiveChannelId(channel.id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3" style={{ height: 'calc(100vh - 140px)' }}>
      <ChannelListPanel
        channels={channels}
        activeChannelId={activeChannelId}
        unreadFor={unreadFor}
        onSelect={handleSelect}
        onNewDm={() => setNewDmOpen(true)}
      />
      <MessageThreadPanel channel={activeChannel} personName={personName} personRole={personRole} />
      <NewDmModal open={newDmOpen} personName={personName} onClose={() => setNewDmOpen(false)} onSelect={handleStartDm} />
    </div>
  )
}
