import { ParticipantTile, type ParticipantDeviceState } from './participant-tile'

interface VideoTileGridProps {
  youName: string
  youState: ParticipantDeviceState
  otherName: string
  /** The other participant's device state is fixed (mock — no real second client to reflect toggles from), always shown camera-on/mic-on/hand-down. */
  otherState: ParticipantDeviceState
}

/** Two-tile video grid: the local "you" tile (controllable) and the other participant's tile (a live, camera-on peer, since there is no real second client in this mock). */
export function VideoTileGrid({ youName, youState, otherName, otherState }: VideoTileGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <ParticipantTile name={youName} isYou state={youState} />
      <ParticipantTile name={otherName} isYou={false} state={otherState} />
    </div>
  )
}
