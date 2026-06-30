import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  BookMarked,
  Bookmark,
  CalendarDays,
  Search,
  CheckSquare,
  CheckCircle,
  ClipboardList,
  Award,
  DollarSign,
  FolderOpen,
  Users,
  ChevronDown,
  Heart,
  ShoppingCart,
  Menu,
  Library,
  Mail,
  UploadCloud,
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

const navSections: NavSection[] = [
  {
    title: 'Digital Library',
    items: [
      { label: 'Browse Books', href: '/library', icon: <BookOpen size={14} /> },
      { label: 'My Borrowings', href: '/borrowings', icon: <Bookmark size={14} /> },
      { label: 'Reservations', href: '/reservations', icon: <CalendarDays size={14} /> },
      { label: 'Search Catalog', href: '/library', icon: <Search size={14} /> },
    ],
  },
  {
    title: 'E-Learning',
    items: [
      { label: 'Browse Courses', href: ' ', icon: <Library size={14} /> },
      { label: 'My Courses', href: ' ', icon: <CheckSquare size={14} /> },
      { label: 'Assessments', href: ' ', icon: <ClipboardList size={14} /> },
      { label: 'Certificates', href: ' ', icon: <Award size={14} /> },
    ],
  },
  {
    title: 'Publishing',
    items: [
      { label: 'Become a Publisher',   href: '/publishing/publishing#publisher', icon: <BookOpen size={14} /> },
      { label: 'Docs',       href: '/publishing/publishng#docs',      icon: <Mail size={14} /> },
      { label: 'Benefits',  href: '/publishing/publishing#benefits', icon: <DollarSign size={14} /> }, // Step 2 — Submit Manuscript',    href: '/publishing/submit',        icon: <UploadCloud size={14} /> },
    ],
  },
  {
    title: 'Research',
    items: [
      { label: 'Research Papers', href: ' ', icon: <ClipboardList size={14} /> },
      { label: 'Research Docs', href: ' ', icon: <FolderOpen size={14} /> },
    ],
  },
]

const wishlistCount = 3
const cartCount = 2

export function MainHeader() {
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

            {/* Category Dropdown */}
            <div className="hidden md:flex">
              <button className="px-4 py-2 bg-w-100 dark:bg-gray-800 text-w-950 dark:text-white rounded flex items-center gap-2 hover:bg-w-200 dark:hover:bg-gray-700 transition font-lato font-semibold">
                <span>All Category</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 border border-w-300 dark:border-gray-600 rounded-l font-lato text-sm focus:outline-none focus:border-w-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
                <button className="px-5 py-2 bg-w-600 text-white rounded-r hover:bg-w-700 transition flex items-center gap-2 font-lato font-semibold">
                  <Search size={16} />
                </button>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher minimal />

              <Link
                href="#"
                className="flex flex-col items-center hover:text-w-600 dark:hover:text-amber-400 transition"
              >
                <Heart size={22} />
                <span className="text-xs font-lato">{wishlistCount}</span>
              </Link>
              <Link href="#" className="relative hover:text-w-600 dark:hover:text-amber-400 transition">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-w-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              <ProfileDropdown />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-wrap gap-2 border-t border-w-200 dark:border-gray-700 pt-3">
            {/* Mobile menu button */}
            <button className="px-4 py-2 bg-w-950 text-white rounded flex items-center gap-2 hover:bg-w-900 transition text-sm font-lato font-semibold md:hidden">
              <Menu size={16} />
              ALL DEPARTMENTS
              <ChevronDown size={14} />
            </button>

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
