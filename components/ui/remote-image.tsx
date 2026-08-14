'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

type RemoteImageProps = Omit<ImageProps, 'onError' | 'src'> & {
  /** May be an empty string/undefined when a resource has no image set (e.g. a course with no cover uploaded) — treated the same as a load failure rather than passed to next/image, which throws on a falsy src. */
  src: ImageProps['src'] | '' | undefined | null
  /** Rendered in place of the image if the remote URL fails to load (e.g. Unsplash unreachable) or is missing. */
  fallback: React.ReactNode
}

/**
 * `next/image` wrapper for externally-hosted photos (Unsplash). Falls back to
 * `fallback` on load failure instead of leaving a broken-image icon, since
 * these URLs point at a live third-party host with no local backup file —
 * and also falls back on a missing/empty src, since Next throws when `src`
 * is an empty string rather than rendering nothing.
 */
export function RemoteImage({ fallback, alt, src, ...imageProps }: RemoteImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) return <>{fallback}</>

  return <Image {...imageProps} src={src} alt={alt} onError={() => setFailed(true)} />
}
