import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { HeroSection } from '@/components/home/hero-section'
import { TrendingBooks } from '@/components/home/trending-books'
import { ELearningSection } from '@/components/home/elearning-section'
import { ResearchSection } from '@/components/home/research-section'
import { MainHeader } from '@/components/main-header'
import { MainFooter } from '@/components/main-footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <MainHeader />
      <HeroSection />

      <TrendingBooks />

      <ELearningSection />

      <ResearchSection />

      {/* Testimonials Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-lato text-sm font-semibold text-w-600 uppercase tracking-widest">
              Stories from Our Community
            </span>
            <h2
              className="font-cinzel text-4xl md:text-5xl font-bold text-w-950 mt-4 mb-4"
              style={{ letterSpacing: '1.5px' }}
            >
              What Scholars Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-form-highlight border border-w-300 rounded-lg p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-w-600 text-w-600" />
                ))}
              </div>
              <p className="font-cormorant text-lg text-w-950 italic mb-6 leading-relaxed">
                "Kingdom Library transformed my research workflow. The comprehensive
                collection and intuitive interface saved me countless hours."
              </p>
              <div className="border-t border-w-300 pt-4">
                <p className="font-cinzel font-semibold text-w-950">Dr. Sarah Chen</p>
                <p className="font-lato text-sm text-w-700">Research Scholar, MIT</p>
              </div>
            </div>

            <div className="bg-form-highlight border border-w-300 rounded-lg p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-w-600 text-w-600" />
                ))}
              </div>
              <p className="font-cormorant text-lg text-w-950 italic mb-6 leading-relaxed">
                "As a graduate student, having access to this many academic resources
                in one place is invaluable. Highly recommended."
              </p>
              <div className="border-t border-w-300 pt-4">
                <p className="font-cinzel font-semibold text-w-950">James Mitchell</p>
                <p className="font-lato text-sm text-w-700">Graduate Student, Oxford</p>
              </div>
            </div>

            <div className="bg-form-highlight border border-w-300 rounded-lg p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-w-600 text-w-600" />
                ))}
              </div>
              <p className="font-cormorant text-lg text-w-950 italic mb-6 leading-relaxed">
                "The platform's search capabilities are exceptional. I discovered
                resources I didn't even know existed. Fantastic experience."
              </p>
              <div className="border-t border-w-300 pt-4">
                <p className="font-cinzel font-semibold text-w-950">Dr. Amara Okafor</p>
                <p className="font-lato text-sm text-w-700">Professor, University of Lagos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/community-feature.png"
            alt="Community learning"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-w-950/75"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2
            className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ letterSpacing: '1.5px' }}
          >
            Join a Global Community
          </h2>
          <p className="font-lato text-w-100 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            Connect with scholars, researchers, and learners from around the world.
            Share knowledge, collaborate on projects, and grow together.
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12">
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">195+</p>
              <p className="font-lato text-sm text-w-300 mt-2">Countries</p>
            </div>
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">2M+</p>
              <p className="font-lato text-sm text-w-300 mt-2">Downloads</p>
            </div>
            <div>
              <p className="font-cinzel text-3xl md:text-4xl font-bold text-w-100">4.9/5</p>
              <p className="font-lato text-sm text-w-300 mt-2">Rating</p>
            </div>
          </div>
          <Link href="/auth/register">
            <ElegantButton variant="primary" className="md:px-10 md:py-4 text-lg">
              Join Our Community Today
            </ElegantButton>
          </Link>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-16 px-4 bg-form-highlight">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-cinzel text-3xl font-bold text-w-950 mb-4">Stay Updated</h2>
          <p className="font-lato text-w-700 mb-8">
            Get recommendations, new arrivals, and exclusive content delivered to your inbox monthly.
          </p>
          <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-6 py-3 font-lato text-sm border border-w-400 bg-white rounded focus:outline-none focus:border-w-600"
              required
            />
            <button
              type="submit"
              className="px-8 py-3 bg-w-600 text-white font-lato font-semibold rounded hover:bg-w-700 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
     <MainFooter />
    </main>
  )
}
