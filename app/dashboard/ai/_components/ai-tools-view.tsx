'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SmartSearchPanel } from './smart-search-panel'
import { AiChatPanel } from './ai-chat-panel'

/** Simulated network delay before the mocked AI panels become visible. */
const LOAD_DELAY_MS = 400

/** Two-column layout: mocked smart search on the left, mocked chat assistant on the right. */
export function AiToolsView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label="Loading AI tools">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SmartSearchPanel />
      <AiChatPanel />
    </div>
  )
}
