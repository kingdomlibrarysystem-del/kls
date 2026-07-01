import { Download, FileText, Award, BarChart3, Lock } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface DownloadItem {
  id: string
  title: string
  type: 'Certificate' | 'Report' | 'Statement'
  date: string
}

const items: DownloadItem[] = [
  { id: '1', title: 'Foundations of Faith — Completion Certificate', type: 'Certificate', date: 'May 12, 2026' },
  { id: '2', title: 'Q2 2026 Borrowing Activity Report',             type: 'Report',      date: 'Jun 01, 2026' },
  { id: '3', title: 'Digital Discipleship — Completion Certificate', type: 'Certificate', date: 'Jun 08, 2026' },
  { id: '4', title: 'Publishing Revenue Statement — May 2026',       type: 'Statement',   date: 'Jun 03, 2026' },
  { id: '5', title: 'Annual Learning Progress Summary',              type: 'Report',      date: 'Jun 20, 2026' },
]

const typeIcon: Record<DownloadItem['type'], React.ReactNode> = {
  Certificate: <Award size={16} />,
  Report: <BarChart3 size={16} />,
  Statement: <FileText size={16} />,
}

export default function DownloadCenterPage() {
  return (
    <div>
      <PageHeader title="Download Center" subtitle="Certificates, reports, and statements" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        File generation is not wired up yet — downloads below are illustrative and disabled.
      </div>

      <div className="bg-form-highlight border border-w-300 rounded-lg divide-y divide-w-300">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-4">
            <div className="text-w-600">{typeIcon[item.type]}</div>
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
          <li>GET /api/downloads/my — list a member's downloadable files</li>
          <li>GET /api/downloads/:id/file — stream/download a generated file</li>
          <li>GET /api/downloads/certificates/:code/verify — public certificate verification</li>
        </ul>
      </div>
    </div>
  )
}
