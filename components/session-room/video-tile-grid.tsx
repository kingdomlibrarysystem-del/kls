import {
  ParticipantTile,
  type ParticipantDeviceState,
} from "./participant-tile";

export interface ExtraParticipant {
  name: string;
  state: ParticipantDeviceState;
}

interface VideoTileGridProps {
  youName: string;
  youState: ParticipantDeviceState;
  youPresenting?: boolean;
  /** Real MediaStream (camera or, while presenting, the captured screen) for the local user's own tile only — see participant-tile.tsx's videoStream docstring for why no other tile ever receives one. */
  youVideoStream?: MediaStream | null;
  /** Hides the local user's OWN tile from their OWN view only — standard Meet/Zoom "Hide self view." Has zero effect on any other participant, since there's no real peer connection anyway. */
  hideSelf?: boolean;
  otherName: string;
  /** The other participant's device state is fixed (mock — no real second client to reflect toggles from), always shown camera-on/mic-on/hand-down. */
  otherState: ParticipantDeviceState;
  /** True when the other party has no live SessionPresence row — shows a real "Waiting to join…" placeholder instead of a fake always-connected state. */
  otherNotJoined?: boolean;
  /** Personas added via AddParticipantModal — real additional tiles, not a fixed 2-up layout. */
  extraParticipants?: ExtraParticipant[];
}

/**
 * Video grid. While presenting, restructures to match Meet's real
 * behavior: the presented content becomes one large primary tile, and
 * every other tile (other participant, any added ones) collapses into a
 * small vertical strip beside it. Reverts to the equal grid once
 * presenting stops. Pure CSS/layout — no new dependency.
 */
export function VideoTileGrid({
  youName,
  youState,
  youPresenting,
  youVideoStream,
  hideSelf,
  otherName,
  otherState,
  otherNotJoined,
  extraParticipants = [],
}: VideoTileGridProps) {
  const youTile = !hideSelf && (
    <ParticipantTile
      name={youName}
      isYou
      state={youState}
      presenting={youPresenting}
      videoStream={youVideoStream}
    />
  );
  const otherTiles = [
    <ParticipantTile
      key={otherName}
      name={otherName}
      isYou={false}
      state={otherState}
      notJoined={otherNotJoined}
    />,
    ...extraParticipants.map((p) => (
      <ParticipantTile
        key={p.name}
        name={p.name}
        isYou={false}
        state={p.state}
      />
    )),
  ];

  if (youPresenting) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 h-full p-3">
        <div className="flex-1 min-w-0 min-h-0">{youTile}</div>
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible sm:w-32 shrink-0">
          {otherTiles.map((tile) => (
            <div key={tile.key} className="w-24 sm:w-full shrink-0">
              {tile}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 h-full p-3 auto-rows-fr">
      {youTile}
      {otherTiles}
    </div>
  );
}
