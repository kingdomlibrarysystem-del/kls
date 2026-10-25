'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookHeart, HeartHandshake, Home, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/member/care', label: 'Overview', icon: Home, exact: true },
  { href: '/member/care/resources', label: 'Read & listen', icon: BookHeart },
  { href: '/member/care/counseling', label: 'Talk to someone', icon: HeartHandshake },
  { href: '/member/care/rehabilitation', label: 'Recovery programme', icon: Sprout },
]

/** Section tabs for Care & Support (scrolls sideways on phones). */
export function CareNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav aria-label="Care & Support" className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-border px-1">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={cn('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors', active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <Icon className="size-4" /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
