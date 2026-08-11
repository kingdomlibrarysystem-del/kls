'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Channel, Message } from './types'

/** Fetches every real channel (course + DM) this user is a participant of. */
export function useChannelsFor(userId: string) {
  const [data, setData] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) { setData([]); return }
    const res = await fetch(`/api/channels?participantId=${userId}`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [userId])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}

/** Fetches every message in one channel, in send order. */
export function useMessages(channelId: string | null) {
  const [data, setData] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!channelId) { setData([]); return }
    const res = await fetch(`/api/messages?channelId=${channelId}`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [channelId])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}

/** Sends a message into an existing channel, or lazily starts a new DM channel (channelId omitted, participantIds provided) — mirrors /api/messages POST's own semantics. */
export async function sendMessage(input: { channelId?: string; senderId: string; body: string; participantIds?: string[] }): Promise<Message> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to send message')
  return json.data
}

/** Marks one message read by this user via the real API. */
export async function markMessageRead(messageId: string, userId: string): Promise<void> {
  await fetch(`/api/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markRead', userId }),
  })
}

/** Toggles an emoji reaction on a message via the real API. */
export async function toggleReaction(messageId: string, emoji: string, userId: string): Promise<Message> {
  const res = await fetch(`/api/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggleReaction', userId, emoji }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update reaction')
  return json.data
}

/** Real unread count for one channel, from this user's POV — messages not sent by them and not yet in readByIds. */
export function unreadCountFor(channelId: string, messages: Message[], userId: string): number {
  return messages.filter((m) => m.channelId === channelId && m.senderId !== userId && !m.readByIds.includes(userId)).length
}
