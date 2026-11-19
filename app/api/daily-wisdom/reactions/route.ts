import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-error-handler'
import { getViewer } from '@/lib/data/course-access'
import { getWisdomReactions } from '@/lib/data/daily-wisdom-reactions'
import { assertWisdomDay } from './_shared'

/**
 * GET /api/daily-wisdom/reactions?verseId=…&date=YYYY-MM-DD — public.
 * The day's likes and comments on that wisdom (expired ones are deleted
 * first; see lib/data/daily-wisdom-reactions.ts). `liked` / `mine` need a
 * signed-in reader.
 */
export const GET = withErrorHandling('/api/daily-wisdom/reactions', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const { verseId, dateKey } = await assertWisdomDay(searchParams.get('verseId'), searchParams.get('date'))
  const viewer = await getViewer()
  const data = await getWisdomReactions(verseId, dateKey, viewer.userId)
  return NextResponse.json({ data, message: 'Reactions fetched', code: 'success', status: 200 })
})
