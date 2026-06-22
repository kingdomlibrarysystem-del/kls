'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Bookmark, CalendarClock, BookMarked,
  GraduationCap, FlaskConical, BookCopy, Bell, User, ShieldCheck,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const nav: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard',      href: '/dashboard/admin',               icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    group: 'Digital Library',
    items: [
      { label: 'Browse Library', href: '/dashboard/admin/library',       icon: <BookOpen size={16} /> },
      { label: 'Borrowings',  href: '/dashboard/admin/borrowings',    icon: <Bookmark size={16} /> },
      { label: 'Reservations',   href: '/dashboard/admin/reservations',  icon: <CalendarClock size={16} /> },
    ],
  },
  {
    group: 'Learning & Research',
    items: [
      { label: 'E-Learning',     href: '/dashboard/admin/e-learning',    icon: <GraduationCap size={16} /> },
      { label: 'Research',       href: '/dashboard/admin/research',      icon: <FlaskConical size={16} /> },
      { label: 'Publishing',     href: '/dashboard/admin/publishing',    icon: <BookCopy size={16} /> },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Notifications',  href: '/dashboard/admin/notifications', icon: <Bell size={16} /> },
      { label: 'Profile',        href: '/dashboard/admin/profile',       icon: <User size={16} /> },
      { label: 'Admin Panel',    href: '/dashboard/admin/admin',         icon: <ShieldCheck size={16} /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="w-64 bg-form-section border-r border-w-400 h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-w-400">
        <h1 className="font-cinzel text-lg font-semibold text-w-950" style={{ letterSpacing: '1px' }}>
          Kingdom Library
        </h1>
        <p className="font-lato text-xs text-w-700 mt-0.5">Knowledge Hub</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-5 overflow-hidden">
        {nav.map((section) => (
          <div key={section.group}>
            <p className="font-lato text-xs font-semibold text-w-600 uppercase tracking-widest px-2 mb-1">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded font-lato text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-w-600 text-white'
                      : 'text-w-950 hover:bg-w-200'
                  }`}>
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-w-400">
        <button className="w-full text-left px-3 py-2.5 text-w-700 hover:text-w-950 font-lato text-sm rounded hover:bg-w-200 transition-colors">
          Sign Out
        </button>
      </div>
    </aside>
  )
}
