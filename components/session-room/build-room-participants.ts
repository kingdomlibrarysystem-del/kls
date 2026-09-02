import type { ParticipantDeviceState } from './participant-tile'
import type { PresenceRow } from '@/lib/sessions/use-session-presence'
import type { RemoteParticipantState } from './use-livekit-room'

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
  /** True once LiveKit is connected — when set, LiveKit's own remote-participant list is ground truth for "joined" (see the `joinedFor` helper below), same precedence rule already used for the primary other-party row in use-other-party-state.ts. Without this, a row could show connected on the video grid (LiveKit truth) while its Participants-panel row still read "not joined" from a presence poll that simply hadn't refreshed yet or whose displayName didn't exactly match. */
  liveKitReady: boolean
  /** Every real LiveKit remote participant currently in the room, for the same ground-truth check. */
  remoteParticipants: RemoteParticipantState[]
}

function presenceIdFor(name: string, roster: PresenceRow[]): string | undefined {
  return roster.find((p) => p.displayName === name && p.present)?.id
}

/** "Joined" ground truth for one named row: prefer a real LiveKit match once connected, falling back to the polled presence roster only when LiveKit isn't ready — mirrors computeOtherPartyState's own precedence for the primary other-party row. */
function joinedFor(name: string, presenceRoster: PresenceRow[], liveKitReady: boolean, remoteParticipants: RemoteParticipantState[]): boolean {
  if (liveKitReady) return remoteParticipants.some((p) => p.name === name)
  return !!presenceIdFor(name, presenceRoster)
}

/**
 * Builds the participant-list entries for SessionSidePanel — split out of
 * session-room-view.tsx to keep that file under the 200-line cap now that
 * it supports a second `viewer` mode. See session-room-view.tsx's
 * `viewer` prop docstring for why admin needs different participant
 * shape (both real parties as named tiles, not one relabeled "you").
 */
export function buildRoomParticipants({ viewer, youName, you, otherName, otherState, otherJoined, adminExtraParticipant, addedNames, addedState, isLecturerName, presenceRoster, unmatchedRemotes, liveKitReady, remoteParticipants }: BuildRoomParticipantsInput): RoomParticipantEntry[] {
  const youEntry: RoomParticipantEntry = viewer === 'admin'
    ? { name: youName, role: 'Admin', state: you, joined: true }
    : { name: youName, role: 'Learner', state: you, joined: true }

  const otherEntry: RoomParticipantEntry = {
    name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: otherState,
    presenceId: presenceIdFor(otherName, presenceRoster), joined: otherJoined,
  }

  const adminEntry: RoomParticipantEntry[] = adminExtraParticipant
    ? [{
        name: adminExtraParticipant.name, role: 'Lecturer' as const, state: adminExtraParticipant.state,
        presenceId: presenceIdFor(adminExtraParticipant.name, presenceRoster),
        joined: joinedFor(adminExtraParticipant.name, presenceRoster, liveKitReady, remoteParticipants),
      }]
    : []

  const addedEntries: RoomParticipantEntry[] = addedNames.map((name) => ({
    name, role: isLecturerName(name) ? 'Lecturer' as const : 'Learner' as const, state: addedState,
    presenceId: presenceIdFor(name, presenceRoster),
    joined: joinedFor(name, presenceRoster, liveKitReady, remoteParticipants),
  }))

  const guestEntries: RoomParticipantEntry[] = unmatchedRemotes.map((r) => ({
    name: r.name || r.identity, role: 'Guest' as const, state: r.state, joined: true,
  }))

  return [youEntry, otherEntry, ...adminEntry, ...addedEntries, ...guestEntries]
}
