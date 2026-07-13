'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

type RemoteImageProps = Omit<ImageProps, 'onError'> & {
  /** Rendered in place of the image if the remote URL fails to load (e.g. Unsplash unreachable). */
  fallback: React.ReactNode
}

/**
 * `next/image` wrapper for externally-hosted photos (Unsplash). Falls back to
 * `fallback` on load failure instead of leaving a broken-image icon, since
 * these URLs point at a live third-party host with no local backup file.
 */
export function RemoteImage({ fallback, alt, ...imageProps }: RemoteImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return <>{fallback}</>

  return <Image {...imageProps} alt={alt} onError={() => setFailed(true)} />
}
