import Link from 'next/link'
import { FlaskConical, FileText, Search, FolderOpen, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface ResearchSection {
  icon: React.ReactNode
  title: string
  desc: string
  href?: string
}

const sections: ResearchSection[] = [
  { icon: <Upload size={20} />,       title: 'Submit Paper',          desc: 'Submit a research paper linked to one of your projects, with keywords and manuscript file.', href: '/dashboard/research/submit' },
  { icon: <FolderOpen size={20} />,   title: 'Collaborations',        desc: 'View research projects with their status, dates, and contributor lists.',                    href: '/dashboard/research/collaborations' },
  { icon: <FileText size={20} />,     title: 'Paper Repository',      desc: 'Browse published research papers, searchable by title or keyword.',                          href: '/dashboard/research/repository' },
  { icon: <Search size={20} />,       title: 'Resource Discovery',    desc: 'Unified search across library resources, publications, and research papers.' },
  { icon: <FlaskConical size={20} />, title: 'Research Analytics',    desc: 'Track citation counts, view stats, and measure the impact of submitted papers.' },
]

export default function ResearchPage() {
  return (
    <div>
      <PageHeader title="Research Support" subtitle="Projects, papers, and resource discovery" />

      <p className="font-lato text-sm text-w-700 mb-8">Manage research projects, papers, and contributor collaborations.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const card = (
            <div className={`bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 h-full ${s.href ? 'hover:border-w-600 transition-colors' : ''}`}>
              <div className="flex items-center gap-2 text-w-600">{s.icon}
                <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
              </div>
              <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
              <span className={`inline-block mt-auto px-2 py-0.5 rounded text-xs font-lato w-fit ${
                s.href ? 'bg-green-50 text-green-700' : 'bg-w-200 text-w-700'
              }`}>
                {s.href ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          )
          return s.href ? (
            <Link key={s.title} href={s.href} aria-label={s.title}>{card}</Link>
          ) : (
            <div key={s.title}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
