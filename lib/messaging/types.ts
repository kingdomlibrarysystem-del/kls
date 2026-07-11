import type { UserRole } from '@/contexts/auth-context'

/**
 * Shared Message/Channel types for Slack-style chat — per-course channels
 * (auto-derived from enrollment + lecturer data) and 1:1 DMs (genuinely
 * stored). Lives in lib/messaging/ rather than under one role's _shared/
 * folder (e.g. app/lecturer/_shared/, the Phase 3 precedent for
 * session-booking): unlike session booking, which the lecturer approves
 * and therefore "owns," chat has no single owning role — a course channel
 * is jointly used by its learner(s) and lecturer, and DMs can occur
 * between any two roles (member, lecturer, contributor). This mirrors
 * lib/role-switcher.ts, already genuinely cross-cutting, non-role-owned
 * shared code, rather than lib/utils.ts-style generic helpers.
 *
 * Out of scope for this phase (noted here, not silently skipped): full
 * threading (replies-to-a-specific-message) and @mention autocomplete.
 * Reactions and per-channel member lists ARE in scope — see use-messages.ts.
 */
export type ChannelKind = 'course' | 'dm'

export interface Channel {
  /** `course-${courseId}` for a course channel, or a stable sorted-pair key for a DM — see dmChannelId() in use-messages.ts. */
  id: string
  kind: ChannelKind
  /** Course title for a course channel, or the other party's display name for a DM. */
  name: string
  /** Everyone who can see this channel — all enrolled learners + the course's lecturer for a course channel, exactly 2 people for a DM. */
  participantNames: string[]
  /** Only set for kind === 'course'. */
  courseId?: string
}

export interface MessageReaction {
  emoji: string
  /** Names of everyone who reacted with this emoji — toggling adds/removes your own name, mirroring a real reactions UI. */
  reactedBy: string[]
}

export interface Message {
  id: string
  channelId: string
  senderName: string
  senderRole: UserRole
  body: string
  sentAt: string
  /** Names of everyone who has read this message — used to derive each channel's unread count per-viewer rather than storing a separate read flag per person. */
  readBy: string[]
  reactions: MessageReaction[]
}
