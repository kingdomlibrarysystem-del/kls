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

/**
 * Public landing page — a Server Component (PERFORMANCE.md Rule 15). All
 * section data is loaded here in one parallel batch (lib/data/home.ts) and
 * passed down as props; previously each section fetched from the browser
 * (whole catalogs with pageSize=1000, plus a staff-only API that returned
 * 401 to signed-out visitors).
 */
export default async function Page() {
  // Cached for 60s (lib/server/home-page.ts) so a visit does not hit the database every time.
  const data = await getCachedHomePageData()

  return (
    <main className="min-h-screen bg-white">
      <MainHeader />
      <HeroSection
        bookCovers={data.trendingBooks.flatMap((b) => (b.cover ? [b.cover] : [])).slice(0, 4)}
        courseImages={data.courses.flatMap((c) => (c.image ? [c.image] : []))}
      />
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
