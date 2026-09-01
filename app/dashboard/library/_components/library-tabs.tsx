'use client'

import Link from 'next/link'
import { BookCopy, Map } from 'lucide-react'

export type LibraryTab = 'inventory' | 'kcs-map'

interface LibraryTabsProps {
  active: LibraryTab
}

const TABS: { id: LibraryTab; label: string; icon: typeof BookCopy; href: string }[] = [
  { id: 'inventory', label: 'Book Inventory', icon: BookCopy, href: '/dashboard/library' },
  { id: 'kcs-map', label: 'KCS Map', icon: Map, href: '/dashboard/library/kcs' },
]

/**
 * Switches the Digital Library admin section between Book Inventory and
 * the KCS Map (browse pillars/scrolls + Manage Categories) — two real
 * routes rather than client-side tab state, since the KCS Map page
 * already has its own `?pillar=` URL state and two nested dynamic detail
 * routes (`kcs/[pillar]/[scrollId]`, `kcs/categories/[id]`) that need a
 * real page to return to. Matches ManageCategoriesTabs' visual style.
 * KCS Map now lives here instead of its own top-level sidebar entry,
 * since categories are a library concept.
 */
export function LibraryTabs({ active }: LibraryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-6" role="tablist" aria-label="Digital Library sections">
      {TABS.map(({ id, label, icon: Icon, href }) => {
        const isActive = id === active
        return (
          <Link
            key={id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className="flex items-center gap-1.5"
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
              background: isActive ? 'var(--gold)' : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
