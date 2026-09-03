import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import { completeSession, type SessionRequest } from '@/lib/sessions/use-session-requests'
import { buildRoomParticipants } from './build-room-participants'
import { computeOtherPartyState, guestParticipantEntries, OTHER_PARTY_STATE } from './use-other-party-state'
import type { ParticipantDeviceState } from './participant-tile'
import type { useRoomMedia } from './use-room-media'
import type { useSessionPresence } from '@/lib/sessions/use-session-presence'
import type { useSessionRecording } from './use-session-recording'
import type { useLiveTranscript } from './use-live-transcript'
import type { useRoomActivityLogging } from './use-room-activity-logging'

const ADDED_PARTICIPANT_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

interface RoomViewStateInput {
  sessionId: string
  viewer: 'learner' | 'admin'
  /** Undefined while the session request is still loading or blocked by RoomAccessGuard — derivations below fall back to empty/safe defaults so this hook can always be called unconditionally (React's rules of hooks forbid calling it only once `request` resolves). */
  request: SessionRequest | undefined
  adminDisplayName: string
  handRaised: boolean
  otherHandRaised: boolean
  addedNames: string[]
  media: ReturnType<typeof useRoomMedia>['media']
  liveKit: ReturnType<typeof useRoomMedia>['liveKit']
  liveKitReady: boolean
  presence: ReturnType<typeof useSessionPresence>
  recording: ReturnType<typeof useSessionRecording>
  recordingStream: MediaStream | null
  transcript: ReturnType<typeof useLiveTranscript>
  activity: ReturnType<typeof useRoomActivityLogging>
  onLeft: () => void
}

/**
 * Derived room state (who's who, who's really joined, the room-view
 * action handlers) — split out of session-room-view.tsx to keep that
 * file under the 200-line cap. Pure derivation + handler closures, no
 * JSX, so it reads like the "controller" half of the view.
 */
export function useRoomViewState({
  sessionId, viewer, request, adminDisplayName, handRaised, otherHandRaised, addedNames,
  media, liveKit, liveKitReady, presence, recording, recordingStream, transcript, activity, onLeft,
}: RoomViewStateInput) {
  const youName = viewer === 'learner' ? (request?.learnerName ?? 'You') : adminDisplayName
  const otherName = viewer === 'admin' ? (request?.learnerName ?? 'Learner') : (request?.lecturerName ?? 'No lecturer assigned yet')
  const adminExtraParticipant = viewer === 'admin' && request?.lecturerName ? { name: request.lecturerName, state: OTHER_PARTY_STATE } : null
  const isLecturerName = (name: string) => lecturerRoster.some((l) => l.name === name)
  const you: ParticipantDeviceState = { cameraOn: media.cameraOn, micOn: media.micOn, handRaised }
  const knownNames = new Set([otherName, ...(adminExtraParticipant ? [adminExtraParticipant.name] : []), ...addedNames])

  const { otherRemote, otherPresent, otherState, unmatchedRemotes } = computeOtherPartyState({
    liveKitReady, remoteParticipants: liveKit.remoteParticipants, otherName, otherHandRaised, presenceRoster: presence.roster, request, knownNames,
  })
  const guestEntries = guestParticipantEntries(unmatchedRemotes)
  const extraParticipants = [
    ...(adminExtraParticipant ? [adminExtraParticipant] : []),
    ...addedNames.map((name) => ({ name, state: ADDED_PARTICIPANT_STATE })),
    ...guestEntries,
  ]
  const roomParticipants = buildRoomParticipants({
    viewer, youName, you, otherName, otherState, otherJoined: otherPresent,
    adminExtraParticipant, addedNames, addedState: ADDED_PARTICIPANT_STATE, isLecturerName,
    presenceRoster: presence.roster, unmatchedRemotes: guestEntries,
    liveKitReady, remoteParticipants: liveKit.remoteParticipants,
  })

  const handleLeave = () => {
    presence.leaveNow()
    media.cleanup()
    recording.discard()
    transcript.stop()
    // Leaving the room happens immediately regardless of this call's
    // outcome — a slow/failed PATCH shouldn't trap the admin in the
    // room. A failure here just means the request stays APPROVED
    // instead of COMPLETED, recoverable from the admin session list.
    if (viewer === 'admin') {
      completeSession(sessionId).catch((err) => {
        console.error(`Failed to mark session ${sessionId} complete on leave:`, err)
      })
    }
    onLeft()
  }

  const toggleRecording = () => (recording.recording ? recording.stop() : recording.start(recordingStream))
  const toggleCaptions = () => (transcript.active ? transcript.stop() : transcript.start())
  const toggleHand = () => {
    const next = !handRaised
    if (liveKitReady) liveKit.sendData({ kind: 'hand-raise', raised: next, senderName: youName })
    activity.logAndBroadcast(next ? 'hand-raised' : 'hand-lowered', youName)
    return next
  }
  const togglePresenting = () => {
    const willPresent = !media.presenting
    media.togglePresenting()
    activity.logAndBroadcast(willPresent ? 'presenting-started' : 'presenting-stopped', youName)
  }

  return {
    youName, otherName, you, otherRemote, otherPresent, otherState, extraParticipants, roomParticipants,
    handleLeave, toggleRecording, toggleCaptions, toggleHand, togglePresenting,
  }
}
