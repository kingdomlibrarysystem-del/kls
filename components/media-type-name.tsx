'use client'

import { useMediaTypes } from '@/lib/client/use-media-types'
import { mediaTypeName } from '@/lib/media-types-shared'

/**
 * Renders the display name of a resource's media type from the admin-managed
 * list (never a hardcoded label map). Shows the stored code until the list
 * has loaded, or if the type was removed.
 */
export function MediaTypeName({ code }: { code: string | null | undefined }) {
  const { mediaTypes } = useMediaTypes()
  return <>{mediaTypeName(code, mediaTypes)}</>
}
