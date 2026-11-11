import { HeroSection } from '@/components/home/hero-section'
import { TrendingBooks } from '@/components/home/trending-books'
import { ELearningSection } from '@/components/home/elearning-section'
import { ResearchSection } from '@/components/home/research-section'
import { NewsletterSection } from '@/components/home/newsletter-section'
import { NewsPaperSection } from '@/components/home/news-paper-section'
import { AboutSection } from '@/components/home/about-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { MainHeader } from '@/components/main-header'
import { MainFooter } from '@/components/main-footer'
import { getCachedHomePageData } from '@/lib/server/home-page'
import { getPublicServices } from '@/lib/services/data'
import { ServicesSection } from '@/components/home/services-section'
import type { Metadata } from 'next'
import { MAIN_PAGES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = { alternates: { canonical: '/' } }

/**
 * Structured data for Google: who we are (Organization), the site name
 * (WebSite) and the main pages (SiteNavigationElement). Google picks the links
 * under the result (sitelinks) by itself; this and the sitemap tell it which
 * pages matter most: Library, E-Learning, Services, Newsletter, Sign up, Log in.
 */
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/kls-logo.jpg`, description: SITE_DESCRIPTION },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, alternateName: ['Kingdom Library System', 'LibKingdom'], url: SITE_URL, publisher: { '@id': `${SITE_URL}/#organization` } },
    ...MAIN_PAGES.map((p) => ({ '@type': 'SiteNavigationElement', name: p.name, description: p.description, url: `${SITE_URL}${p.path}` })),
  ],
}

/**
 * Public landing page — a Server Component (PERFORMANCE.md Rule 15). All
 * section data is loaded here in one parallel batch (lib/data/home.ts) and
 * passed down as props; previously each section fetched from the browser
 * (whole catalogs with pageSize=1000, plus a staff-only API that returned
 * 401 to signed-out visitors).
 */
export default async function Page() {
  // Cached for 60s (lib/server/home-page.ts) so a visit does not hit the database every time.
  const [data, services] = await Promise.all([
    getCachedHomePageData(),
    // Programmes + life areas for the header menu and the Services section (cached).
    getPublicServices().catch(() => ({ programs: [], areas: [] })),
  ])

  return (
    <main className="min-h-screen bg-white">
      {/* Read by Google only; '<' is escaped so the JSON can never close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }} />
      <MainHeader services={services.programs.map(({ slug, name, tagline, icon, color }) => ({ slug, name, tagline, icon, color }))} />
      <HeroSection
        bookCovers={data.trendingBooks.flatMap((b) => (b.cover ? [b.cover] : [])).slice(0, 4)}
        courseImages={data.courses.flatMap((c) => (c.image ? [c.image] : []))}
      />
      <ServicesSection programs={services.programs} areas={services.areas} />
      <NewsPaperSection items={data.news} />
      <TrendingBooks books={data.trendingBooks} />
      <ELearningSection courses={data.courses} stats={data.courseStats} />
      <ResearchSection papers={data.papers} />
      <AboutSection />
      <TestimonialsSection />
      <NewsletterSection />
      <MainFooter />
    </main>
  )
}
