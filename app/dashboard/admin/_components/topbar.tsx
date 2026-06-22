'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User, ChevronRight } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/dashboard/admin':               'Admin',
  '/dashboard/admin/library':       'Digital Library',
  '/dashboard/admin/borrowings':    'My Borrowings',
  '/dashboard/admin/reservations':  'Reservations',
  '/dashboard/admin/e-learning':    'E-Learning',
  '/dashboard/admin/publishing':    'Publishing',
  '/dashboard/admin/research':      'Research',
  '/dashboard/admin/notifications': 'Notifications',
  '/dashboard/admin/profile':       'Profile',
}

function Breadcrumb() {
  const pathname = usePathname()

  // Build segments: Dashboard > Library > [id]
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []

  let built = ''
  for (const seg of segments) {
    built += `/${seg}`
    crumbs.push({
      label: routeLabels[built] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: built,
    })
  }

  return (
    <nav className="flex items-center gap-1 font-lato text-sm text-w-700">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={13} className="text-w-500" />}
          {i === crumbs.length - 1 ? (
            <span className="text-w-950 font-semibold">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-w-950 transition-colors">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function DashboardTopbar() {
  return (
    <header className="h-14 bg-white border-b border-w-300 px-6 flex items-center justify-between shrink-0">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <Link href="/dashboard/admin/notifications" className="relative text-w-700 hover:text-w-950 transition-colors">
          <Bell size={20} />
          {/* Unread badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-w-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            2
          </span>
        </Link>

        {/* User */}
        <Link href="/dashboard/admin/profile" className="flex items-center gap-2 text-w-700 hover:text-w-950 transition-colors">
          <div className="w-8 h-8 rounded-full bg-w-200 border border-w-400 flex items-center justify-center">
            <User size={15} />
          </div>
          <span className="font-lato text-sm hidden md:block">My Account</span>
        </Link>
      </div>
    </header>
  )
}
