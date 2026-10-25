import Link from 'next/link'
import { BookCopy, Upload, CheckCircle, DollarSign, Search, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { getPublishingOverview } from '@/lib/data/publications'
import { getCommissionPercent } from '@/lib/data/publishing-revenue'
import { CommissionRateCard } from './_components/commission-rate-card'
import { cn } from '@/lib/utils'

interface Section {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
  /** A live number shown on the card, e.g. "3 waiting". */
  stat?: string
  /** Highlight when something needs attention (books waiting for review). */
  attention?: boolean
}

/**
 * Publishing overview: the real workflow (publisher submits → reviewer
 * approves → the book appears in the library for members) with live counts,
 * loaded on the server. Cards follow the signed-in role's permissions:
 * "Submit a Book" / "My Submissions" need publications:submit; deciding in
 * the Review Queue needs publications:approve (Admin has both).
 */
export default async function PublishingPage() {
  const session = await requireStaffPage()
  const [canSubmit, canApprove, overview, commission] = await Promise.all([
    pageHasPermission('publications:submit'),
    pageHasPermission('publications:approve'),
    getPublishingOverview(session.userId),
    getCommissionPercent(),
  ])
  const { mine } = overview

  const sections: Section[] = [
    ...(canSubmit
      ? [
          { icon: <Upload size={20} />, title: 'Submit a Book', desc: 'Add a book under a KCS category with its cover, file and price. It goes to review before members can see it.', href: '/dashboard/publishing/submit' },
          {
            icon: <BookCopy size={20} />, title: 'My Submissions', href: '/dashboard/publishing/my',
            desc: 'Your books: drafts, in review, sent back with notes, and published.',
            stat: mine.total === 0 ? 'No books yet' : `${mine.total} book${mine.total === 1 ? '' : 's'} · ${mine.inReview} in review · ${mine.published} published${mine.rejected ? ` · ${mine.rejected} sent back` : ''}`,
            attention: mine.rejected > 0,
          },
        ]
      : []),
    {
      icon: <CheckCircle size={20} />, title: 'Review Queue', href: '/dashboard/publishing/review',
      desc: canApprove ? 'Approve books to publish them to the library, or send them back with a reason.' : 'See the books waiting for review (your role cannot approve).',
      stat: `${overview.awaitingReview} waiting`,
      attention: canApprove && overview.awaitingReview > 0,
    },
    { icon: <DollarSign size={20} />, title: 'Revenue & Royalties', desc: 'Earnings per published book and the publisher / platform split.', href: '/dashboard/publishing/revenue', stat: `${overview.totalRevenue.toLocaleString()} RWF earned` },
    { icon: <Search size={20} />, title: 'Published Catalog', desc: 'Every approved book. Filter by language and publisher.', href: '/dashboard/publishing/catalog', stat: `${overview.published} published` },
  ]

  return (
    <div>
      <PageHeader title="Publishing Services" subtitle="Publishers submit books, reviewers approve them, members read them in the library" />

      <CommissionRateCard percent={commission} canEdit={session.role === 'admin'} className="mb-6" />

      <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="How publishing works">
        {['Publisher submits a book', 'Reviewer approves or sends back', 'Book appears in the library'].map((step, i, all) => (
          <li key={step} className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">{i + 1}</span>
            <span>{step}</span>
            {i < all.length - 1 && <ArrowRight className="size-3.5" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} aria-label={s.title} className="group">
            <div className={cn(
              'flex h-full flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs transition-colors group-hover:border-primary/50',
              s.attention ? 'border-warning/50' : 'border-border',
            )}>
              <div className="flex items-center gap-2 text-primary">
                {s.icon}
                <h3 className="font-cinzel text-sm font-semibold text-foreground">{s.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              {s.stat && (
                <span suppressHydrationWarning className={cn('mt-auto inline-block w-fit rounded px-2 py-0.5 text-xs font-semibold', s.attention ? 'bg-warning/10 text-warning' : 'bg-muted text-foreground')}>
                  {s.stat}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!canSubmit && (
        <p className="mt-6 text-xs text-muted-foreground">
          To submit books, an admin must give your role the <b>Submit Publications</b> permission (Roles &amp; Permissions).
        </p>
      )}
    </div>
  )
}
