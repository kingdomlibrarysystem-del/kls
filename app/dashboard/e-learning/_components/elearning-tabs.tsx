'use client'

import Link from 'next/link'
import { LayoutGrid, BookOpen, Tag, Video } from 'lucide-react'

export type ElearningTab = 'overview' | 'catalog' | 'categories' | 'lessons'

interface ElearningTabsProps {
  active: ElearningTab
}

/**
 * Quizzes/Enrollments/Progress/Certificates stay separate top-level
 * sidebar routes, not tabs here — mirrors how the Library tab bar only
 * covers Book Inventory/KCS Map while Borrow & Return/Reservations/
 * Reports stay separate sidebar sections (see library-tabs.tsx).
 */
const TABS: { id: ElearningTab; label: string; icon: typeof BookOpen; href: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, href: '/dashboard/e-learning' },
  { id: 'catalog', label: 'Course Catalog', icon: BookOpen, href: '/dashboard/e-learning/catalog' },
  { id: 'categories', label: 'Categories', icon: Tag, href: '/dashboard/e-learning/categories' },
  { id: 'lessons', label: 'Lessons', icon: Video, href: '/dashboard/e-learning/lessons' },
]

export function ElearningTabs({ active }: ElearningTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-6" role="tablist" aria-label="E-Learning sections">
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
