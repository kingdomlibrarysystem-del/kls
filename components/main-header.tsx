'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import {
  BookOpen,
  Bookmark,
  CalendarDays,
  Search,
  CheckSquare,
  ClipboardList,
  Award,
  ChevronDown,
  Library,
  Menu,
} from 'lucide-react'
import { ProfileDropdown } from './profile-dropdown'
import { LanguageSwitcher } from './language-switcher'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Publishing and Research sections were removed — no public page exists for
 * "Become a Publisher"/"Docs"/"Benefits" or "Research Papers"/"Research Docs"
 * (only the authenticated `/dashboard/publishing/*` and `/dashboard/research/*`
 * admin routes exist), so there was no real destination to wire them to.
 */
const navSections: NavSection[] = [
  {
    title: 'Digital Library',
    items: [
      { label: 'Browse Books', href: '/library', icon: <BookOpen size={14} /> },
      { label: 'My Borrowings', href: '/member/borrowings', icon: <Bookmark size={14} /> },
      { label: 'Reservations', href: '/member/reservations', icon: <CalendarDays size={14} /> },
      { label: 'Search Catalog', href: '/library', icon: <Search size={14} /> },
    ],
  },
  {
    title: 'E-Learning',
    items: [
      { label: 'Browse Courses', href: '/member/e-learning', icon: <Library size={14} /> },
      { label: 'My Courses', href: '/member/courses', icon: <CheckSquare size={14} /> },
      { label: 'Assessments', href: '/member/assessments', icon: <ClipboardList size={14} /> },
      { label: 'Certificates', href: '/member/certificates', icon: <Award size={14} /> },
    ],
  },
]

export function MainHeader() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/library?q=${encodeURIComponent(query.trim())}` : '/library')
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white dark:bg-[#0a0d1a] shadow-md py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          {/* Logo, Search, Icons Row */}
          <div className="flex items-center gap-6 mb-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/kls-logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full w-10 h-10"
              />
              <h1
                className="font-cinzel text-lg font-bold text-w-950 dark:text-white hidden sm:block"
                style={{ letterSpacing: "1px" }}
              >
                Kingdom Library
              </h1>
            </Link>

            {/* Browse Library shortcut (was a decorative, unwired "All Category" dropdown) */}
            <Link
              href="/library"
              className="hidden md:flex px-4 py-2 bg-w-100 dark:bg-gray-800 text-w-950 dark:text-white rounded items-center gap-2 hover:bg-w-200 dark:hover:bg-gray-700 transition font-lato font-semibold"
            >
              <span>Browse Library</span>
              <ChevronDown size={14} />
            </Link>

            {/* Search Bar — submits to the real /library search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search books by title or author..."
                  aria-label="Search books by title or author"
                  className="flex-1 px-4 py-2 border border-w-300 dark:border-gray-600 rounded-l font-lato text-sm focus:outline-none focus:border-w-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
                <button type="submit" aria-label="Search" className="px-5 py-2 bg-w-600 text-white rounded-r hover:bg-w-700 transition flex items-center gap-2 font-lato font-semibold">
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Icons — Wishlist/Cart removed: no such feature exists anywhere in the
                data model or spec, so those were fabricated counts on a dead link */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher minimal />
              <ProfileDropdown />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-wrap gap-2 border-t border-w-200 dark:border-gray-700 pt-3">
            {/* Mobile: Browse Library shortcut (was a decorative, unwired "ALL DEPARTMENTS" button) */}
            <Link
              href="/library"
              className="px-4 py-2 bg-w-950 text-white rounded flex items-center gap-2 hover:bg-w-900 transition text-sm font-lato font-semibold md:hidden"
            >
              <Menu size={16} />
              Browse Library
              <ChevronDown size={14} />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex gap-2 items-center flex-1">
              {navSections.map((section) => (
                <div key={section.title} className="relative group">
                  <button className="px-4 py-2 text-w-950 dark:text-gray-200 hover:text-w-600 dark:hover:text-amber-400 transition font-lato text-sm font-semibold flex items-center gap-1">
                    <span className="flex items-center gap-1.5">
                      {section.title}
                    </span>
                    <ChevronDown size={12} />
                  </button>

                  <div className="absolute left-0 mt-0 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                    {section.items.map((item) => (
                      <Link
                        key={`${section.title}-${item.label}`}
                        href={item.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700 border-b border-w-100 dark:border-gray-700 last:border-0 font-lato"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
