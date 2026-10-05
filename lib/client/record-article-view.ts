'use client'

import { anonymousViewerId } from '@/lib/client/record-resource-view'

/**
 * Records that this visitor opened a news article (POST /api/news/views) and
 * resolves to the article's unique-viewer total (null if it could not be
 * recorded). Works with or without login — signed-in readers are identified
 * by their account on the server, everyone else by this device's anonymous
 * id, exactly like book views. Failures are swallowed: counting must never
 * block reading.
 */
export async function recordArticleView(articleId: string): Promise<number | null> {
  try {
    const res = await fetch('/api/news/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, anonymousId: anonymousViewerId() }),
      keepalive: true,
    })
    if (!res.ok) return null
    const json = await res.json()
    return typeof json?.data?.views === 'number' ? json.data.views : null
  } catch {
    return null
  }
}
