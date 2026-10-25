/** Shared, client-safe helpers for playing a resource's audio / video. */

/** The 11-character YouTube id in a watch / embed / shorts / youtu.be link, or null when the URL is not YouTube. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

export type PlayableKind = 'video' | 'audio'

/**
 * What a library resource can be played as: a video when it has a video file,
 * otherwise audio when it has an audio file, otherwise null (read-only book).
 * Driven by the uploaded files rather than the admin-managed media type code,
 * so it stays correct for custom media types too.
 */
export function playableKind(r: { audioUrl?: string | null; videoUrl?: string | null }): PlayableKind | null {
  if (r.videoUrl) return 'video'
  if (r.audioUrl) return 'audio'
  return null
}
