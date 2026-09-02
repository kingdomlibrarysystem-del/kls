'use client'

import Link from 'next/link'
import { Newspaper, ScrollText, ClipboardList, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { useArticles } from './_shared/use-articles'

interface NewsSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: NewsSection[] = [
  { icon: <ScrollText size={20} />,     title: 'Articles',     desc: 'Draft, submit, and manage every article and edition.',        href: '/dashboard/news/articles' },
  { icon: <ClipboardList size={20} />,  title: 'Review Queue', desc: 'Approve or reject articles submitted for review.',            href: '/dashboard/news/review' },
  { icon: <BookOpen size={20} />,       title: 'Editions',     desc: 'Approved articles and editions ready to publish.',            href: '/dashboard/news/editions' },
]

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
      <p className="font-cinzel text-2xl font-bold text-w-950">{value}</p>
      <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{label}</p>
    </div>
  )
}

/** Real News & Newspapers overview — replaces the "Coming Soon" placeholder. Pulls live counts from the same store the sub-pages use. */
export default function NewsPage() {
  const { data: articles } = useArticles()

  const published = articles.filter((a) => a.status === 'PUBLISHED').length
  const drafts = articles.filter((a) => a.status === 'DRAFT').length
  const pendingReview = articles.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length

  return (
    <div>
      <PageHeader title="News & Newspapers" subtitle="Editions, feeds, and publication alerts" />

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Pending Review" value={pendingReview} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 hover:border-w-600 transition-colors">
            <div className="flex items-center gap-2 text-w-600">{s.icon}
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
            </div>
            <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
