import type { Contributor } from '@/app/dashboard/research/collaborations/_components/collaborations-data'

function getInitials(name: string): string {
  const parts = name.replace(/^(Dr\.|Pastor|Elder)\s+/i, '').trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

/**
 * Dialect-B equivalent of the admin side's `ContributorAvatar` (which is
 * hardcoded Tailwind, not reusable here) — same initials-on-solid-color
 * approach, no photographic art stretched over a named individual.
 */
interface ContributorInitialsProps {
  contributor: Contributor
  /** Overlapping-stack spacing for a horizontal row of avatars (e.g. a card summary) — omit for a plain vertical list (e.g. a detail modal). */
  overlap?: boolean
}

export function ContributorInitials({ contributor, overlap }: ContributorInitialsProps) {
  return (
    <div
      title={contributor.name}
      aria-label={contributor.name}
      style={{
        width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700,
        border: '2px solid var(--bg-card)', flexShrink: 0, marginLeft: overlap ? -6 : 0,
      }}
    >
      {getInitials(contributor.name)}
    </div>
  )
}
