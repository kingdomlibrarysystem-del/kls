import type { ParticipantDeviceState } from './participant-tile'
import type { PresenceRow } from '@/lib/sessions/use-session-presence'

export interface RoomParticipantEntry {
  name: string
  role: 'Lecturer' | 'Learner' | 'Admin'
  state: ParticipantDeviceState
  /** Set when this row has a live SessionPresence row — a real "remove from call" action only ever applies to someone who is actually present. */
  presenceId?: string
}

interface BuildRoomParticipantsInput {
  viewer: 'learner' | 'admin'
  youName: string
  you: ParticipantDeviceState
  otherName: string
  otherState: ParticipantDeviceState
  /** Set only for the admin viewer — the lecturer shows as a genuine named tile alongside the learner, rather than reusing the single "other party" slot meant for a 2-person call. */
  adminExtraParticipant: { name: string; state: ParticipantDeviceState } | null
  addedNames: string[]
  addedState: ParticipantDeviceState
  isLecturerName: (name: string) => boolean
  /** Real presence roster — used to attach each row's live presenceId, if any, so the panel can offer a genuine remove action. */
  presenceRoster: PresenceRow[]
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
export function buildRoomParticipants({ viewer, youName, you, otherName, otherState, adminExtraParticipant, addedNames, addedState, isLecturerName, presenceRoster }: BuildRoomParticipantsInput): RoomParticipantEntry[] {
  const youEntry: RoomParticipantEntry = viewer === 'admin'
    ? { name: youName, role: 'Admin', state: you }
    : { name: youName, role: 'Learner', state: you }

  const otherEntry: RoomParticipantEntry = {
    name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: otherState,
    presenceId: presenceIdFor(otherName, presenceRoster),
  }

  const adminEntry: RoomParticipantEntry[] = adminExtraParticipant
    ? [{ name: adminExtraParticipant.name, role: 'Lecturer' as const, state: adminExtraParticipant.state, presenceId: presenceIdFor(adminExtraParticipant.name, presenceRoster) }]
    : []

  const addedEntries: RoomParticipantEntry[] = addedNames.map((name) => ({
    name, role: isLecturerName(name) ? 'Lecturer' as const : 'Learner' as const, state: addedState,
    presenceId: presenceIdFor(name, presenceRoster),
  }))

  return [youEntry, otherEntry, ...adminEntry, ...addedEntries]
}
