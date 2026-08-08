'use client'

import { useState } from 'react'
import { Download, FileText, BarChart3, Eye, Lock } from 'lucide-react'
import { useCertificatesAdmin, type CertificateRecord } from '@/app/dashboard/e-learning/certificates/_components/use-certificates-admin'
import { CertificateViewModal } from '@/app/member/certificates/_components/certificate-view-modal'

interface StaticDownloadItem {
  id: string
  title: string
  type: 'Report' | 'Statement'
  date: string
}

/**
 * Report/Statement rows have no real "download as file" affordance
 * anywhere in this app yet — the underlying data is real and viewable on
 * its own dashboard page (Reports & Analytics, Publishing Revenue), but no
 * page offers a file export today. Kept as an honest disabled row rather
 * than either fabricating a download or removing the row entirely, per
 * the same disclosed-limitation pattern as /dashboard/library/sales.
 */
const staticItems: StaticDownloadItem[] = [
  { id: 's-1', title: 'Q2 2026 Borrowing Activity Report', type: 'Report', date: 'Jun 01, 2026' },
  { id: 's-2', title: 'Publishing Revenue Statement — May 2026', type: 'Statement', date: 'Jun 03, 2026' },
  { id: 's-3', title: 'Annual Learning Progress Summary', type: 'Report', date: 'Jun 20, 2026' },
]

const staticTypeIcon: Record<StaticDownloadItem['type'], React.ReactNode> = {
  Report: <BarChart3 size={16} />,
  Statement: <FileText size={16} />,
}

/**
 * Download Center: real issued certificates (View opens the same
 * print-to-PDF flow CertificateViewModal already provides on the member
 * side) plus Report/Statement rows, which stay disabled with an honest
 * disclaimer since no download-as-file pattern exists yet for tabular
 * report data anywhere in this app.
 */
export function DownloadsView() {
  const { data: certificates } = useCertificatesAdmin()
  const [viewing, setViewing] = useState<CertificateRecord | null>(null)

  return (
    <div>
      <div className="bg-form-highlight border border-w-300 rounded-lg divide-y divide-w-300 mb-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="flex items-center gap-3 px-5 py-4">
            <div className="text-w-600"><FileText size={16} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-cinzel text-sm font-semibold text-w-950 truncate">{cert.course} — Completion Certificate</p>
              <p className="font-lato text-xs text-w-700">
                {cert.member} · Certificate · {cert.issuedAt}{cert.revoked && ' · Revoked'}
              </p>
            </div>
            <button
              onClick={() => setViewing(cert)}
              aria-label={`View certificate for ${cert.member}, ${cert.course}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-w-600 text-white rounded text-xs font-lato hover:bg-w-700 transition-colors"
            >
              <Eye size={12} />
              <Download size={12} />
              View / Download
            </button>
          </div>
        ))}
        {certificates.length === 0 && (
          <div className="px-5 py-4 font-lato text-xs text-w-600">No certificates have been issued yet.</div>
        )}
      </div>

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-4 font-lato text-xs text-w-700">
        Reports and statements below reflect real data (see Reports &amp; Analytics and Publishing Revenue), but no file-export pattern exists for tabular data yet — downloads are disabled.
      </div>

      <div className="bg-form-highlight border border-w-300 rounded-lg divide-y divide-w-300">
        {staticItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-4">
            <div className="text-w-600">{staticTypeIcon[item.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-cinzel text-sm font-semibold text-w-950 truncate">{item.title}</p>
              <p className="font-lato text-xs text-w-700">{item.type} · {item.date}</p>
            </div>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 bg-w-200 text-w-500 rounded text-xs font-lato cursor-not-allowed opacity-70"
            >
              <Lock size={12} />
              <Download size={12} />
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-form-section border border-w-400 rounded-lg p-5">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Planned API Endpoints</h3>
        <ul className="font-lato text-xs text-w-700 space-y-1">
          <li>GET /api/downloads/reports/:id/file — generate/stream a report as a downloadable file</li>
          <li>GET /api/downloads/statements/:id/file — generate/stream a revenue statement as a downloadable file</li>
        </ul>
      </div>

      <CertificateViewModal certificate={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
