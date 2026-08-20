import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";
import {
  ParticipantTile,
  type ParticipantDeviceState,
} from "./participant-tile";

/** Attaches a real remote audio track to a hidden <audio> element — audio has no visual tile of its own, it just needs to actually play. */
function RemoteAudio({ track }: { track: Track }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [track]);
  return <audio ref={ref} autoPlay />;
}

export interface ExtraParticipant {
  name: string;
  state: ParticipantDeviceState;
  cameraTrack?: Track | null;
  micTrack?: Track | null;
}

interface VideoTileGridProps {
  youName: string;
  youState: ParticipantDeviceState;
  youPresenting?: boolean;
  /** Real MediaStream (mock fallback) for the local user's own tile. */
  youVideoStream?: MediaStream | null;
  /** Real local LiveKit camera track, when connected to a real room. */
  youCameraTrack?: Track | null;
  /** Hides the local user's OWN tile from their OWN view only. */
  hideSelf?: boolean;
  otherName: string;
  otherState: ParticipantDeviceState;
  /** True when the other party has no live SessionPresence row — shows a real "Waiting to join…" placeholder instead of a fake always-connected state. */
  otherNotJoined?: boolean;
  /** The other party's real remote camera track, once LiveKit has subscribed to it — absent while not connected/not publishing. */
  otherCameraTrack?: Track | null;
  otherMicTrack?: Track | null;
  /** Personas added via AddParticipantModal — real additional tiles, not a fixed 2-up layout. */
  extraParticipants?: ExtraParticipant[];
}

/**
 * Video grid. Three layouts:
 * - Presenting: the presented content becomes one large primary tile,
 *   every other tile collapses into a small strip beside it (Meet-style).
 * - Solo (only "you" are actually present — the other party hasn't
 *   joined and nothing was added): one tile fills the entire canvas,
 *   matching a real single-person call rather than wasting half the
 *   space on a permanent "waiting" box.
 * - Otherwise: an even grid.
 */
export function VideoTileGrid({
  youName,
  youState,
  youPresenting,
  youVideoStream,
  youCameraTrack,
  hideSelf,
  otherName,
  otherState,
  otherNotJoined,
  otherCameraTrack,
  otherMicTrack,
  extraParticipants = [],
}: VideoTileGridProps) {
  const isSolo = !!otherNotJoined && extraParticipants.length === 0 && !hideSelf;

  const youTile = !hideSelf && (
    <ParticipantTile
      name={youName}
      isYou
      state={youState}
      presenting={youPresenting}
      videoStream={youVideoStream}
      liveKitTrack={youCameraTrack}
      solo={isSolo}
    />
  );
  const otherTiles = [
    <ParticipantTile
      key={otherName}
      name={otherName}
      isYou={false}
      state={otherState}
      notJoined={otherNotJoined}
      liveKitTrack={otherCameraTrack}
    />,
    ...extraParticipants.map((p) => (
      <ParticipantTile
        key={p.name}
        name={p.name}
        isYou={false}
        state={p.state}
        liveKitTrack={p.cameraTrack}
      />
    )),
  ];

  const remoteAudio = otherMicTrack && <RemoteAudio track={otherMicTrack} />;

  if (isSolo) {
    return (
      <div className="h-full">
        {youTile}
        {remoteAudio}
      </div>
    );
  }

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
        {remoteAudio}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 h-full p-3 auto-rows-fr">
      {youTile}
      {otherTiles}
      {remoteAudio}
    </div>
  );
}
