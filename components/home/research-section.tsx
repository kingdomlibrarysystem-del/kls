import Link from 'next/link'
import { ArrowRight, BookMarked, FlaskConical, Globe } from 'lucide-react'

const articles = [
  {
    tag: 'Featured Research',
    icon: <FlaskConical size={16} />,
    title: 'The Future of Digital Knowledge: How AI is Reshaping Academic Research',
    excerpt:
      'Explore how artificial intelligence is transforming the way scholars discover, synthesise, and publish research — and what this means for the next generation of knowledge workers.',
    author: 'Dr. Amara Okafor',
    role: 'Professor, University of Lagos',
    readTime: '8 min read',
    href: '/dashboard/research/repository',
    highlight: true,
  },
  {
    tag: 'Open Access',
    icon: <Globe size={16} />,
    title: 'Breaking Barriers: Publishing Your Research for a Global Audience',
    excerpt:
      'Open access publishing removes the walls between knowledge and people. Learn how Kingdom Library helps independent researchers reach millions of readers worldwide.',
    author: 'James Mitchell',
    role: 'Graduate Researcher, Oxford',
    readTime: '5 min read',
    href: '/dashboard/research/repository',
    highlight: false,
  },
  {
    tag: 'Collaboration',
    icon: <BookMarked size={16} />,
    title: 'Collaborative Research in the Digital Age: Building Your Network',
    excerpt:
      'Great discoveries rarely happen alone. Discover how our platform connects researchers across continents, enabling co-authorship and joint publications like never before.',
    author: 'Dr. Sarah Chen',
    role: 'Research Scholar, MIT',
    readTime: '6 min read',
    href: '/dashboard/research/collaborate',
    highlight: false,
  },
]

export function ResearchSection() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 uppercase tracking-widest">
              Inspire · Discover · Publish
            </span>
            <h2 className="font-cinzel text-2xl md:text-4xl font-bold text-w-950 mt-2">
              Research &amp; Insights
            </h2>
            <p className="font-lato text-w-700 mt-3 max-w-lg">
              Stories and insights from our research community to spark your next big idea.
            </p>
          </div>
          <Link
            href="/dashboard/research"
            className="inline-flex items-center gap-2 font-lato font-semibold text-w-700 hover:text-w-950 border-b border-w-600 hover:border-w-950 transition pb-0.5 self-start md:self-auto"
          >
            View All Research <ArrowRight size={15} />
          </Link>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.title}
              href={article.href}
              className={`group flex flex-col rounded-xl overflow-hidden border transition-shadow hover:shadow-lg ${
                article.highlight
                  ? 'border-w-600 bg-w-950'
                  : 'border-w-200 bg-white'
              }`}
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${article.highlight ? 'bg-w-accent' : 'bg-w-300'}`} />

              <div className="flex flex-col flex-1 p-6">
                {/* Tag */}
                <span
                  className={`inline-flex items-center gap-1.5 font-lato text-xs font-semibold uppercase tracking-wider mb-4 ${
                    article.highlight ? 'text-w-accent' : 'text-w-600'
                  }`}
                >
                  {article.icon}
                  {article.tag}
                </span>

                {/* Title */}
                <h3
                  className={`font-cinzel text-lg font-bold leading-snug mb-3 group-hover:text-w-600 transition-colors ${
                    article.highlight ? 'text-w-100' : 'text-w-950'
                  }`}
                >
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p
                  className={`font-lato text-sm leading-relaxed flex-1 mb-6 ${
                    article.highlight ? 'text-w-300' : 'text-w-700'
                  }`}
                >
                  {article.excerpt}
                </p>

                {/* Footer */}
                <div
                  className={`flex items-center justify-between border-t pt-4 text-xs font-lato ${
                    article.highlight ? 'border-w-800 text-w-400' : 'border-w-200 text-w-700'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${article.highlight ? 'text-w-200' : 'text-w-950'}`}>
                      {article.author}
                    </p>
                    <p>{article.role}</p>
                  </div>
                  <span className={`px-2 py-1 rounded ${article.highlight ? 'bg-w-800 text-w-300' : 'bg-w-100 text-w-700'}`}>
                    {article.readTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div className="mt-10 rounded-xl bg-w-950 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-cinzel text-lg font-bold text-w-accent">Ready to share your research?</p>
            <p className="font-lato text-sm text-w-300 mt-1">
              Submit your paper and reach scholars across the globe.
            </p>
          </div>
          <Link
            href="/dashboard/research/new-paper"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-w-accent text-w-950 rounded font-lato font-bold hover:bg-w-300 transition"
          >
            Submit Your Paper <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  )
}
