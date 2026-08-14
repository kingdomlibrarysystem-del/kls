/**
 * Shared Message/Channel types for Slack-style chat — per-course channels
 * (real Channel rows, one per Course, seeded in Phase 7) and 1:1 DMs
 * (created lazily on first message). Backed by the real /api/messages and
 * /api/channels — see their own docstrings for the collection shape.
 * Identity is by real User.id throughout (senderId/participantIds), not
 * display name — every participant (member, lecturer, contributor) now
 * has a real backing User row (see lib/identity/lecturer-identity.ts and
 * contributor-identity.ts).
 *
 * Out of scope for this phase (noted here, not silently skipped): full
 * threading (replies-to-a-specific-message) and @mention autocomplete.
 * Reactions and per-channel member lists ARE in scope — see use-messages.ts.
 */
export type ChannelKind = 'course' | 'dm'

export interface Channel {
  id: string
  kind: ChannelKind
  /** Course title for a course channel, or the other party's display name for a DM. */
  name: string
  /** Real User ids of everyone who can see this channel. */
  participantIds: string[]
  /** Only set for kind === 'course'. */
  courseId?: string
}

export interface MessageReaction {
  emoji: string
  /** Real User ids of everyone who reacted with this emoji — toggling adds/removes your own id. */
  reactedByIds: string[]
}

export interface Message {
  id: string
  channelId: string
  senderId: string
  senderName: string
  body: string
  sentAt: string
  /** Real User ids of everyone who has read this message. */
  readByIds: string[]
  reactions: MessageReaction[]
}
