import type { RemoteParticipantState } from './use-livekit-room'
import type { ParticipantDeviceState } from './participant-tile'
import type { PresenceRow } from '@/lib/sessions/use-session-presence'
import type { SessionRequest } from '@/lib/sessions/use-session-requests'

const OTHER_PARTY_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

interface ComputeOtherPartyInput {
  liveKitReady: boolean
  remoteParticipants: RemoteParticipantState[]
  otherName: string
  otherHandRaised: boolean
  presenceRoster: PresenceRow[]
  request: SessionRequest | undefined
  knownNames: Set<string>
}

/**
 * Real "is the other party actually here, and what's their state"
 * computation, plus which real LiveKit participants matched nothing
 * this app's own invite/add flow knows about (a genuine join via a
 * shared room link) — split out of session-room-view.tsx to keep it
 * under the 200-line cap. Once LiveKit is connected, a real
 * remoteParticipants match is the ground truth for "joined," not the
 * polled /presence displayName match (case/whitespace differences, or
 * the poll simply not having refreshed yet).
 */
export function computeOtherPartyState({ liveKitReady, remoteParticipants, otherName, otherHandRaised, presenceRoster, request, knownNames }: ComputeOtherPartyInput) {
  const otherRemote = remoteParticipants.find((p) => p.name === otherName || p.identity === request?.lecturerId || p.identity === request?.learnerId)
  const otherPresent = liveKitReady ? !!otherRemote : presenceRoster.some((p) => p.displayName === otherName && p.present)
  const otherState: ParticipantDeviceState = liveKitReady && otherRemote
    ? { cameraOn: !!otherRemote.cameraTrack, micOn: !otherRemote.micMuted, handRaised: otherHandRaised }
    : OTHER_PARTY_STATE
  const unmatchedRemotes = liveKitReady
    ? remoteParticipants.filter((p) => !knownNames.has(p.name) && p.identity !== request?.lecturerId && p.identity !== request?.learnerId)
    : []

  return { otherRemote, otherPresent, otherState, unmatchedRemotes }
}

/** Maps unmatched real LiveKit participants into the shape VideoTileGrid's extraParticipants and buildRoomParticipants' unmatchedRemotes both expect — one source instead of two ad hoc inline maps. */
export function guestParticipantEntries(unmatchedRemotes: RemoteParticipantState[]) {
  return unmatchedRemotes.map((r) => ({
    identity: r.identity,
    name: r.name || r.identity,
    cameraTrack: r.cameraTrack,
    micTrack: r.micTrack,
    state: { cameraOn: !!r.cameraTrack, micOn: !r.micMuted, handRaised: false } as ParticipantDeviceState,
  }))
}

export { OTHER_PARTY_STATE }
