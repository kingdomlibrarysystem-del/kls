import { Bot, Sparkles, MessageSquare, Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <MessageSquare size={20} />, title: 'AI Chat Assistant', desc: 'Ask questions about the library, courses, or borrowing — inform only, no write actions.', status: 'coming' },
  { icon: <Sparkles size={20} />,      title: 'Smart Search',      desc: 'Semantic search across resources, publications, and research papers.',                 status: 'coming' },
  { icon: <Lightbulb size={20} />,     title: 'Recommendations',   desc: 'Personalized resource and course suggestions based on your activity.',                status: 'coming' },
  { icon: <Bot size={20} />,           title: 'Content Summaries', desc: 'AI-generated summaries of long resources and research papers.',                       status: 'coming' },
]

export default function AiToolsPage() {
  return (
    <div>
      <PageHeader title="AI & Tools" subtitle="Chat assistance, smart search, and recommendations" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. A full mocked chat and search experience arrives in a later phase.
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
          <li>POST /api/ai/chat — send a message to the assistant (rate-limited)</li>
          <li>GET /api/ai/search?q= — semantic search across all content</li>
          <li>GET /api/ai/recommendations — personalized suggestions</li>
          <li>POST /api/ai/summarize/:resourceId — generate a cached summary</li>
        </ul>
      </div>
    </div>
  )
}
