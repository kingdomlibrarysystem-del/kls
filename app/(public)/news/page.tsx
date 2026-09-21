import { Suspense } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ElegantButton } from '@/components/ui/elegant-button'
import { NewsFeedView } from '@/app/member/news/_components/news-feed-view'

/**
 * Public news listing — the no-login destination the email "Read Article"
 * links point to (/news). Mirrors the member "News & Newspapers" feed but
 * lives outside /member so anonymous visitors can read published articles
 * (same pattern as the public /library next to member /member/library).
 */
export default function PublicNewsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <PageHeader
          title="News & Newspapers"
          subtitle="Newsletters, articles, and newspaper editions"
          className="text-center"
        />
        <Suspense fallback={null}>
          <NewsFeedView detailPath="/news" />
        </Suspense>
        <div className="mt-14 text-center border-t border-w-300 pt-10">
          <p className="font-lato text-w-700 mb-4">
            Want to join the Kingdom Library community?
          </p>
          <Link href="/auth/register">
            <ElegantButton variant="primary">Join Kingdom Library</ElegantButton>
          </Link>
        </div>
      </div>
    </div>
  )
}