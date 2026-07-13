import type { Contributor } from './collaborations-data'

interface ContributorAvatarProps {
  contributor: Contributor
}

function getInitials(name: string): string {
  const parts = name.replace(/^(Dr\.|Pastor|Elder)\s+/i, '').trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Circular initials avatar for a contributor. No photographic avatar art is
 * available locally that represents individual people, so initials-on-gold
 * chips are used instead of stretching an unrelated stock image over a
 * person's identity.
 */
export function ContributorAvatar({ contributor }: ContributorAvatarProps) {
  return (
    <div
      title={contributor.name}
      aria-label={contributor.name}
      className="w-8 h-8 rounded-full bg-w-600 text-white flex items-center justify-center font-cinzel text-xs font-semibold border-2 border-white shadow-sm shrink-0"
    >
      {getInitials(contributor.name)}
    </div>
  )
}
