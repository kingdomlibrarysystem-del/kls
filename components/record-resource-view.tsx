'use client'

import { useEffect } from 'react'
import { recordResourceView } from '@/lib/client/record-resource-view'

/**
 * Drop into a book's detail page: counts this visitor as a viewer when the
 * page opens (signed in or not — see recordResourceView). Renders nothing.
 * A mount effect is the right tool here: the anonymous device id lives in
 * the browser, so this cannot be done on the server (PERFORMANCE.md 15.3).
 */
export function RecordResourceView({ resourceId }: { resourceId: string }) {
  useEffect(() => {
    recordResourceView(resourceId)
  }, [resourceId])
  return null
}
