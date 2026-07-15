import { ParticipantTile, type ParticipantDeviceState } from './participant-tile'

export interface ExtraParticipant {
  name: string
  state: ParticipantDeviceState
}

interface VideoTileGridProps {
  youName: string
  youState: ParticipantDeviceState
  youPresenting?: boolean
  otherName: string
  /** The other participant's device state is fixed (mock — no real second client to reflect toggles from), always shown camera-on/mic-on/hand-down. */
  otherState: ParticipantDeviceState
  /** Personas added via AddParticipantModal — real additional tiles, not a fixed 2-up layout. */
  extraParticipants?: ExtraParticipant[]
}

/** Video grid: the local "you" tile (controllable), the other participant's tile, plus any added participants — grows past 2-up once more are added. */
export function VideoTileGrid({ youName, youState, youPresenting, otherName, otherState, extraParticipants = [] }: VideoTileGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <ParticipantTile name={youName} isYou state={youState} presenting={youPresenting} />
      <ParticipantTile name={otherName} isYou={false} state={otherState} />
      {extraParticipants.map((p) => (
        <ParticipantTile key={p.name} name={p.name} isYou={false} state={p.state} />
      ))}
    </div>
  )
}
