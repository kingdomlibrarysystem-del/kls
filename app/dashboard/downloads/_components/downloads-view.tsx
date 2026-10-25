'use client'

import { useState } from 'react'
import { Download, FileText, BarChart3, Eye, Lock, Wallet, GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCertificatesAdmin } from '@/app/dashboard/e-learning/certificates/_components/use-certificates-admin'

interface ReportDef {
  key: string
  title: string
  description: string
}

const REPORT_ICON: Record<string, React.ReactNode> = {
  'borrowing-activity': <BarChart3 size={16} />,
  'publishing-revenue': <Wallet size={16} />,
  'learning-progress': <GraduationCap size={16} />,
}

/** YYYY-MM-DD in the viewer's own calendar. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Download Center: real issued certificates (View opens the certificate page
 * with its print-to-PDF flow) and three live reports downloaded as CSV for a
 * chosen period (GET /api/downloads/reports/[report]). Reports need the
 * "View Reports" permission.
 */
export function DownloadsView({ reports, canDownloadReports }: { reports: ReportDef[]; canDownloadReports: boolean }) {
  const { data: certificates } = useCertificatesAdmin()
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return dayKey(d) })
  const [to, setTo] = useState(() => dayKey(new Date()))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<string | null>(null)

  const download = async (report: ReportDef) => {
    setError('')
    setLastResult(null)
    if (from > to) { setError('“From” must be on or before “To”.'); return }
    setBusy(report.key)
    try {
      const res = await fetch(`/api/downloads/reports/${report.key}?from=${from}&to=${to}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message ?? 'Could not build the report')
      }
      const blob = await res.blob()
      const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `${report.key}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      const count = Number(res.headers.get('x-row-count') ?? '0')
      setLastResult(`${report.title}: ${count} row${count === 1 ? '' : 's'} downloaded.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build the report')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-cinzel text-sm font-semibold text-w-950">Certificates</h2>
        <div className="divide-y divide-w-300 rounded-lg border border-w-300 bg-form-highlight">
          {certificates.map((cert) => (
            <div key={cert.id} className="flex items-center gap-3 px-5 py-4">
              <div className="text-w-600"><FileText size={16} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-cinzel text-sm font-semibold text-w-950">{cert.course} — Completion Certificate</p>
                <p className="font-lato text-xs text-w-700">
                  {cert.member} · Certificate · {cert.issuedAt}{cert.revoked && ' · Revoked'}
                </p>
              </div>
              <UniversalButton
                href={`/member/certificates/${cert.id}`}
                variant="primary"
                size="sm"
                icon={<Eye size={12} />}
                aria-label={`View certificate for ${cert.member}, ${cert.course}`}
              >
                <Download size={12} />
                View / Download
              </UniversalButton>
            </div>
          ))}
          {certificates.length === 0 && (
            <div className="px-5 py-4 font-lato text-xs text-w-600">No certificates have been issued yet.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-cinzel text-sm font-semibold text-w-950">Reports &amp; statements</h2>
        {!canDownloadReports ? (
          <div className="flex items-center gap-2 rounded-lg border border-w-300 bg-w-100 px-5 py-4 font-lato text-xs text-w-700">
            <Lock size={14} /> Your role can&apos;t download reports. An admin can grant <b>View Reports</b> in Roles &amp; Permissions.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-w-300 bg-form-highlight px-5 py-4">
              <div className="space-y-1">
                <Label htmlFor="report-from" className="text-xs">From</Label>
                <Input id="report-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-to" className="text-xs">To</Label>
                <Input id="report-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
              </div>
              <p className="pb-2 font-lato text-xs text-w-700">Files are CSV — they open in Excel or Google Sheets.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </div>
            )}
            {lastResult && <p role="status" className="font-lato text-xs text-success">{lastResult}</p>}

            <div className="divide-y divide-w-300 rounded-lg border border-w-300 bg-form-highlight">
              {reports.map((report) => (
                <div key={report.key} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="text-w-600">{REPORT_ICON[report.key] ?? <FileText size={16} />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-cinzel text-sm font-semibold text-w-950">{report.title}</p>
                    <p className="font-lato text-xs text-w-700">{report.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => download(report)}
                    disabled={!!busy}
                    aria-busy={busy === report.key}
                    className="flex items-center gap-1.5 rounded bg-w-600 px-3 py-1.5 font-lato text-xs font-semibold text-white transition-colors hover:bg-w-700 disabled:cursor-wait disabled:opacity-70 dark:text-primary-foreground"
                  >
                    {busy === report.key ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {busy === report.key ? 'Preparing…' : 'Download CSV'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
