'use client'

import { getRootCategories } from '@/lib/kcs-taxonomy'

interface KcsPillarTabsProps {
  activeSlug: string
  onChange: (pillarSlug: string) => void
}

/** Tab bar switching between the 8 KCS pillars on the single consolidated /dashboard/kcs page. */
export function KcsPillarTabs({ activeSlug, onChange }: KcsPillarTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="KCS pillars">
      {getRootCategories().map((pillar) => {
        const active = pillar.slug === activeSlug
        return (
          <button
            key={pillar.slug}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(pillar.slug)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
              background: active ? 'var(--gold)' : 'var(--bg-card)',
              color: active ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {pillar.code}
          </button>
        )
      })}
    </div>
  )
}
