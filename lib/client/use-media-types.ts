'use client'

import { useSharedList } from '@/lib/client/use-shared-list'
import type { MediaTypeOption } from '@/lib/media-types-shared'

/**
 * The admin-managed media types (GET /api/media-types), shared across every
 * component on the page: one request, cached for the session and revalidated
 * on mount. Call `refetch()` after creating/editing/deleting a type.
 */
export function useMediaTypes(): { mediaTypes: MediaTypeOption[]; loading: boolean; refetch: () => Promise<void> } {
  const { data, loading, refetch } = useSharedList<MediaTypeOption>('/api/media-types')
  return { mediaTypes: data, loading, refetch }
}
