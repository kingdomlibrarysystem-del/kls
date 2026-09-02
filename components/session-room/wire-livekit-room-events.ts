import { Room, RoomEvent, type RemoteParticipant } from 'livekit-client'
import type { LiveKitDataMessage } from './use-livekit-room'

interface WireLiveKitRoomEventsInput {
  room: Room
  updateRemote: (participant: RemoteParticipant) => void
  removeRemote: (identity: string) => void
  onData?: (message: LiveKitDataMessage) => void
  onParticipantConnected?: (participant: RemoteParticipant) => void
  onParticipantDisconnected?: (participant: RemoteParticipant) => void
}

/**
 * Attaches every RoomEvent listener this room needs — split out of
 * use-livekit-room.ts to keep that file under the 200-line cap. Pure
 * wiring, no state of its own; callbacks are passed in fresh each call so
 * the caller controls how they stay current (e.g. via refs) without this
 * function needing to know that detail.
 */
export function wireLiveKitRoomEvents({ room, updateRemote, removeRemote, onData, onParticipantConnected, onParticipantDisconnected }: WireLiveKitRoomEventsInput) {
  room
    .on(RoomEvent.TrackSubscribed, (_track, _pub, participant) => updateRemote(participant))
    .on(RoomEvent.TrackUnsubscribed, (_track, _pub, participant) => updateRemote(participant))
    .on(RoomEvent.TrackMuted, (_pub, participant) => { if (participant !== room.localParticipant) updateRemote(participant as RemoteParticipant) })
    .on(RoomEvent.TrackUnmuted, (_pub, participant) => { if (participant !== room.localParticipant) updateRemote(participant as RemoteParticipant) })
    .on(RoomEvent.ParticipantConnected, (participant) => { onParticipantConnected?.(participant) })
    .on(RoomEvent.ParticipantDisconnected, (participant) => {
      removeRemote(participant.identity)
      onParticipantDisconnected?.(participant)
    })
    .on(RoomEvent.DataReceived, (payload, participant) => {
      if (!participant) return
      try {
        const message = JSON.parse(new TextDecoder().decode(payload)) as LiveKitDataMessage
        onData?.(message)
      } catch {
        // Ignore malformed payloads rather than crashing the room.
      }
    })
}
