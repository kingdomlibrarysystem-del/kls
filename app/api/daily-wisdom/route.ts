import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { getTodayVerse } from '@/lib/data/daily-wisdom'
import { isDailyWisdomLanguage, isDateKey } from '@/lib/daily-wisdom-shared'

/**
 * GET /api/daily-wisdom?date=YYYY-MM-DD&lang=en — public.
 * The verse the header's Daily Wisdom card shows for that day and language:
 * the verse staff sent for the day, otherwise the automatic rotation (see
 * pickTodayVerse). `date` is the reader's LOCAL date, sent by the browser, so
 * the verse changes at the reader's own midnight. data is null when there is
 * no verse at all.
 */
export const GET = withErrorHandling('/api/daily-wisdom', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? ''
  const lang = searchParams.get('lang') ?? 'en'
  if (!isDateKey(date)) throw new ApiError('date must be YYYY-MM-DD', 400)
  if (!isDailyWisdomLanguage(lang)) throw new ApiError('lang must be en, fr or rw', 400)

  const data = await getTodayVerse(date, lang)
  return NextResponse.json(
    { data, message: 'Daily wisdom fetched successfully', code: 'success', status: 200 },
    // Same answer for every reader of that day/language; a short shared cache keeps the header cheap.
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
})
