import type { ParticipantDeviceState } from './participant-tile'
import type { PresenceRow } from '@/lib/sessions/use-session-presence'

export interface RoomParticipantEntry {
  name: string
  role: 'Lecturer' | 'Learner' | 'Admin' | 'Guest'
  state: ParticipantDeviceState
  /** Set when this row has a live SessionPresence row — a real "remove from call" action only ever applies to someone who is actually present. */
  presenceId?: string
  /** True when this row is genuinely connected right now — either a live SessionPresence row (mock path) or a real LiveKit participant (real path). Drives the "— not joined" label independently of presenceId, since a real LiveKit connection is ground truth once it exists. */
  joined: boolean
}

interface BuildRoomParticipantsInput {
  viewer: 'learner' | 'admin'
  youName: string
  you: ParticipantDeviceState
  otherName: string
  otherState: ParticipantDeviceState
  otherJoined: boolean
  /** Set only for the admin viewer — the lecturer shows as a genuine named tile alongside the learner, rather than reusing the single "other party" slot meant for a 2-person call. */
  adminExtraParticipant: { name: string; state: ParticipantDeviceState } | null
  addedNames: string[]
  addedState: ParticipantDeviceState
  isLecturerName: (name: string) => boolean
  /** Real presence roster — used to attach each row's live presenceId, if any, so the panel can offer a genuine remove action. */
  presenceRoster: PresenceRow[]
  /** Real LiveKit remote participants whose name/identity didn't match any invited/added row above — someone who joined the room directly without going through this app's own invite flow (e.g. a shared room link). Shown as real "Guest" rows instead of being invisible. */
  unmatchedRemotes: { identity: string; name: string; state: ParticipantDeviceState }[]
}

function presenceIdFor(name: string, roster: PresenceRow[]): string | undefined {
  return roster.find((p) => p.displayName === name && p.present)?.id
}

/**
 * Builds the participant-list entries for SessionSidePanel — split out of
 * session-room-view.tsx to keep that file under the 200-line cap now that
 * it supports a second `viewer` mode. See session-room-view.tsx's
 * `viewer` prop docstring for why admin needs different participant
 * shape (both real parties as named tiles, not one relabeled "you").
 */
export function buildRoomParticipants({ viewer, youName, you, otherName, otherState, otherJoined, adminExtraParticipant, addedNames, addedState, isLecturerName, presenceRoster, unmatchedRemotes }: BuildRoomParticipantsInput): RoomParticipantEntry[] {
  const youEntry: RoomParticipantEntry = viewer === 'admin'
    ? { name: youName, role: 'Admin', state: you, joined: true }
    : { name: youName, role: 'Learner', state: you, joined: true }

  const otherEntry: RoomParticipantEntry = {
    name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: otherState,
    presenceId: presenceIdFor(otherName, presenceRoster), joined: otherJoined,
  }

  const adminEntry: RoomParticipantEntry[] = adminExtraParticipant
    ? [{ name: adminExtraParticipant.name, role: 'Lecturer' as const, state: adminExtraParticipant.state, presenceId: presenceIdFor(adminExtraParticipant.name, presenceRoster), joined: !!presenceIdFor(adminExtraParticipant.name, presenceRoster) }]
    : []

  const addedEntries: RoomParticipantEntry[] = addedNames.map((name) => {
    const presenceId = presenceIdFor(name, presenceRoster)
    return { name, role: isLecturerName(name) ? 'Lecturer' as const : 'Learner' as const, state: addedState, presenceId, joined: !!presenceId }
  })

  const guestEntries: RoomParticipantEntry[] = unmatchedRemotes.map((r) => ({
    name: r.name || r.identity, role: 'Guest' as const, state: r.state, joined: true,
  }))

  return [youEntry, otherEntry, ...adminEntry, ...addedEntries, ...guestEntries]
}
