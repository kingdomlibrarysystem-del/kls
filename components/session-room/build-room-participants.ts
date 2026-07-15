import type { ParticipantDeviceState } from './participant-tile'

export interface RoomParticipantEntry {
  name: string
  role: 'Lecturer' | 'Learner' | 'Admin'
  state: ParticipantDeviceState
}

interface BuildRoomParticipantsInput {
  viewer: 'learner' | 'lecturer' | 'admin'
  youName: string
  you: ParticipantDeviceState
  otherName: string
  otherState: ParticipantDeviceState
  /** Set only for the admin viewer — the lecturer shows as a genuine named tile alongside the learner, rather than reusing the single "other party" slot meant for a 2-person call. */
  adminExtraParticipant: { name: string; state: ParticipantDeviceState } | null
  addedNames: string[]
  addedState: ParticipantDeviceState
  isLecturerName: (name: string) => boolean
}

/**
 * Builds the participant-list entries for SessionSidePanel — split out of
 * session-room-view.tsx to keep that file under the 200-line cap now that
 * it supports a third `viewer` mode. See session-room-view.tsx's
 * `viewer` prop docstring for why admin needs different participant
 * shape (both real parties as named tiles, not one relabeled "you").
 */
export function buildRoomParticipants({ viewer, youName, you, otherName, otherState, adminExtraParticipant, addedNames, addedState, isLecturerName }: BuildRoomParticipantsInput): RoomParticipantEntry[] {
  const youEntry: RoomParticipantEntry = viewer === 'admin'
    ? { name: youName, role: 'Admin', state: you }
    : { name: youName, role: viewer === 'learner' ? 'Learner' : 'Lecturer', state: you }

  const otherEntry: RoomParticipantEntry = { name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: otherState }

  const adminEntry: RoomParticipantEntry[] = adminExtraParticipant
    ? [{ name: adminExtraParticipant.name, role: 'Lecturer', state: adminExtraParticipant.state }]
    : []

  const addedEntries: RoomParticipantEntry[] = addedNames.map((name) => ({
    name, role: isLecturerName(name) ? 'Lecturer' : 'Learner', state: addedState,
  }))

  return [youEntry, otherEntry, ...adminEntry, ...addedEntries]
}
