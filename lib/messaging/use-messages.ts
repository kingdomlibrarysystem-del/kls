'use client'

import { useSyncExternalStore } from 'react'
import { useEnrollments } from '@/app/member/_shared/use-enrollments'
import { addNotification } from '@/app/dashboard/notifications/_components/use-notifications'
import type { UserRole } from '@/contexts/auth-context'
import { roleForName } from './identity'
import { deriveCourseChannels, deriveDmChannels } from './derive-channels'
import type { Channel, Message } from './types'

/**
 * Module-level mutable store for DM threads (course channels are derived,
 * not stored — see derive-channels.ts). Same useSyncExternalStore pattern
 * as every other cross-cutting store in this app (use-audit-log.ts,
 * use-notifications.ts, use-session-requests.ts).
 */
let allMessages: Message[] = []
const listeners = new Set<() => void>()
const EMPTY_MESSAGES: Message[] = []

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return allMessages
}

/** Stable sorted-pair channel id so ["Alice","Bob"] and ["Bob","Alice"] resolve to the same DM thread. */
export function dmChannelId(nameA: string, nameB: string): string {
  return `dm-${[nameA, nameB].sort().join('__')}`
}

/**
 * Starts (or returns the shape of) a DM channel between two people — used
 * when a learner/lecturer picks someone to message for the first time,
 * since a DM channel only "exists" in useChannelsFor once a message has
 * actually been sent into it.
 */
export function startDm(nameA: string, nameB: string): Channel {
  return { id: dmChannelId(nameA, nameB), kind: 'dm', name: nameB, participantNames: [nameA, nameB] }
}

/** All channels (course + DM) this person can see. Course channels are derived live; DM channels appear once a first message exists. */
export function useChannelsFor(personName: string): Channel[] {
  const enrollments = useEnrollments()
  const messages = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_MESSAGES)
  return [...deriveCourseChannels(personName, enrollments), ...deriveDmChannels(personName, messages)]
}

function nextMessageId() {
  const max = allMessages.reduce((m, msg) => {
    const n = Number(msg.id.replace('msg-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `msg-${String(max + 1).padStart(4, '0')}`
}

/**
 * Sends a message into a channel (course or DM — both are stored in the
 * same message list; only the channel *roster* differs by kind).
 * Notifies the other party via the real shared notifications store: for
 * a course channel this is always the learner<->lecturer pairing; for a
 * DM it's whichever role `roleForName` resolves the other participant to.
 *
 * Recipient-scoping caveat: recipientRole is role-level, not per-person
 * (see notifications-data.ts's docstring) — in a course channel with
 * multiple learners this would notify every learner's shared role inbox
 * at once rather than the one learner who didn't send the message. This
 * mock system has exactly one live learner persona, so that distinction
 * doesn't yet surface a real bug; it's the same limitation already
 * accepted for session-request notifications in Phase 3.
 */
export function sendMessage(channelId: string, senderName: string, senderRole: UserRole, body: string, participantNames: string[]) {
  const created: Message = {
    id: nextMessageId(),
    channelId,
    senderName,
    senderRole,
    body,
    sentAt: new Date().toISOString(),
    readBy: [senderName],
    reactions: [],
  }
  allMessages = [...allMessages, created]
  emitChange()

  const otherParty = participantNames.find((n) => n !== senderName)
  if (otherParty) {
    // A course channel's other party is always the course's lecturer —
    // no signed-in UserRole seat exists for that persona anymore (portal
    // consolidation), so there is no surviving inbox route to notify; a
    // course-channel message never produces a notification. A DM's other
    // party can still resolve to 'member' via roleForName() (the only
    // UserRole a DM recipient can be), so that path is unaffected.
    const recipientRole = channelId.startsWith('course-') ? undefined : roleForName(otherParty)
    if (recipientRole === 'member') {
      addNotification({
        type: 'course',
        title: 'New Message',
        message: `${senderName}: ${body.length > 60 ? `${body.slice(0, 60)}…` : body}`,
        href: '/member/messages',
        recipientRole,
      })
    }
  }

  return created
}

/** Marks every message in a channel read by this person — drives real per-channel unread badges (see unreadCountFor). */
export function markChannelRead(channelId: string, personName: string) {
  allMessages = allMessages.map((m) =>
    m.channelId === channelId && !m.readBy.includes(personName)
      ? { ...m, readBy: [...m.readBy, personName] }
      : m
  )
  emitChange()
}

/** Toggles an emoji reaction on a message — adds the reactor's name if absent, removes it if present (a real toggle, not append-only). */
export function toggleReaction(messageId: string, emoji: string, reactorName: string) {
  allMessages = allMessages.map((m) => {
    if (m.id !== messageId) return m
    const existing = m.reactions.find((r) => r.emoji === emoji)
    if (!existing) {
      return { ...m, reactions: [...m.reactions, { emoji, reactedBy: [reactorName] }] }
    }
    const reactedBy = existing.reactedBy.includes(reactorName)
      ? existing.reactedBy.filter((n) => n !== reactorName)
      : [...existing.reactedBy, reactorName]
    const reactions = reactedBy.length === 0
      ? m.reactions.filter((r) => r.emoji !== emoji)
      : m.reactions.map((r) => (r.emoji === emoji ? { ...r, reactedBy } : r))
    return { ...m, reactions }
  })
  emitChange()
}

/** Live-subscribes to every message across all channels — used to compute per-channel unread counts without calling useMessages() in a loop (which would break the Rules of Hooks). */
export function useAllMessages(): Message[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_MESSAGES)
}

/** Live-subscribes to one channel's messages, in send order. */
export function useMessages(channelId: string): Message[] {
  const all = useAllMessages()
  return all.filter((m) => m.channelId === channelId)
}

/** Real unread count for one channel, from this person's POV — messages not sent by them and not yet in readBy. */
export function unreadCountFor(channelId: string, messages: Message[], personName: string): number {
  return messages.filter((m) => m.channelId === channelId && m.senderName !== personName && !m.readBy.includes(personName)).length
}
