'use client'

import { kcsPillars } from './kcs-pillars-data'

interface KcsPillarTabsProps {
  activeKey: string
  onChange: (pillarKey: string) => void
}

/** Tab bar switching between the 8 KCS pillars on the single consolidated /dashboard/kcs page. */
export function KcsPillarTabs({ activeKey, onChange }: KcsPillarTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="KCS pillars">
      {Object.values(kcsPillars).map((pillar) => {
        const active = pillar.key === activeKey
        return (
          <button
            key={pillar.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(pillar.key)}
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
