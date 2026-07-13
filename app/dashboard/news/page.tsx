import { Newspaper, Rss, Bookmark, Bell } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <Newspaper size={20} />, title: 'Latest Editions',   desc: 'Browse the newest issues of Kingdom newsletters and newspapers.',          status: 'coming' },
  { icon: <Rss size={20} />,       title: 'Category Feeds',    desc: 'Follow topic-based feeds — ministry updates, community, and events.',      status: 'coming' },
  { icon: <Bookmark size={20} />,  title: 'Saved Articles',    desc: 'Keep a personal reading list of articles saved for later.',                status: 'coming' },
  { icon: <Bell size={20} />,      title: 'Publication Alerts', desc: 'Get notified when a new edition or breaking update is published.',        status: 'coming' },
]

export default function NewsPage() {
  return (
    <div>
      <PageHeader title="News & Newspapers" subtitle="Editions, feeds, and publication alerts" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no editions are published yet.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-w-600">{s.icon}
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
            </div>
            <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
            <span className="inline-block mt-auto px-2 py-0.5 bg-w-200 text-w-700 rounded text-xs font-lato w-fit">Coming Soon</span>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-form-section border border-w-400 rounded-lg p-5">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Planned API Endpoints</h3>
        <ul className="font-lato text-xs text-w-700 space-y-1">
          <li>GET /api/news/editions — list published editions</li>
          <li>GET /api/news/feeds/:category — category-based article feed</li>
          <li>POST /api/news/articles/:id/save — save article to reading list</li>
          <li>GET /api/news/alerts/my — member's subscribed publication alerts</li>
        </ul>
      </div>
    </div>
  )
}
