import { FlaskConical, FileText, Search, FolderOpen } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <FolderOpen size={20} />,    title: 'My Research Projects',  desc: 'Create and manage research projects with collaborators, dates, and status tracking.',  status: 'coming' },
  { icon: <FileText size={20} />,      title: 'Paper Repository',      desc: 'Submit research papers linked to projects. Approved papers are publicly discoverable.', status: 'coming' },
  { icon: <Search size={20} />,        title: 'Resource Discovery',    desc: 'Unified search across library resources, publications, and research papers.',            status: 'coming' },
  { icon: <FlaskConical size={20} />,  title: 'Research Analytics',    desc: 'Track citation counts, view stats, and measure the impact of submitted papers.',        status: 'coming' },
]

export default function ResearchPage() {
  return (
    <div>
      <PageHeader title="Research Support" subtitle="Projects, papers, and resource discovery" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. Researchers can manage projects, submit papers, and discover resources.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <li>GET /api/research/projects — list contributor projects</li>
          <li>POST /api/research/projects — create a research project</li>
          <li>POST /api/research/papers — submit a paper to a project</li>
          <li>GET /api/research/repository — public approved papers</li>
          <li>GET /api/research/search?q= — unified search across all content</li>
        </ul>
      </div>
    </div>
  )
}
