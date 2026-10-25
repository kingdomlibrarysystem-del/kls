import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { DOWNLOAD_REPORTS, buildReport, isDownloadReportKey } from '@/lib/data/download-reports'
import { toCsv } from '@/lib/server/csv'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 3 * 366

function parseDay(value: string | null, fallback: Date): Date {
  if (!value) return fallback
  if (!DAY.test(value)) throw new ApiError('Dates must be YYYY-MM-DD', 400)
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new ApiError('Invalid date', 400)
  return d
}

/**
 * GET /api/downloads/reports/[report]?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Streams the report as a CSV file download. Needs the role permission
 * "reports:view" (Admin always). Defaults: the last 30 days. `to` is
 * inclusive; the period may be up to 3 years.
 */
export const GET = withErrorHandling('/api/downloads/reports/[report]', 'GET', async (request: NextRequest, { params }: { params: Promise<{ report: string }> }) => {
  const auth = await requirePermission('reports:view', 'Your role cannot download reports. Ask an admin to grant "View Reports" in Roles & Permissions.')
  if (auth.response) return auth.response

  const { report } = await params
  if (!isDownloadReportKey(report)) throw new ApiError('Unknown report', 404)

  const { searchParams } = new URL(request.url)
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
  const toDay = parseDay(searchParams.get('to'), today)
  const from = parseDay(searchParams.get('from'), new Date(toDay.getTime() - 29 * 86_400_000))
  const to = new Date(toDay.getTime() + 86_400_000)
  if (from >= to) throw new ApiError('"From" must be on or before "To"', 400)
  if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_DAYS) throw new ApiError('Choose a period of at most 3 years', 400)

  const { header, rows } = await buildReport(report, { from, to })
  const title = DOWNLOAD_REPORTS.find((r) => r.key === report)!.title
  const fileName = `${report}_${from.toISOString().slice(0, 10)}_to_${toDay.toISOString().slice(0, 10)}.csv`

  return new NextResponse(toCsv(header, rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'X-Report-Title': encodeURIComponent(title),
      'X-Row-Count': String(rows.length),
    },
  })
})
