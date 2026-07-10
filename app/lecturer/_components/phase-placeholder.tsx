import type { LucideIcon } from 'lucide-react'

interface PhasePlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
}

/**
 * Dialect B "coming soon" placeholder for lecturer pages whose real content
 * (session-request queue, session list, messaging) lands in a later phase
 * — Phase 1 is the portal shell only. Same honest-disclaimer intent as the
 * Dialect A Rule 9 pattern (e.g. app/dashboard/beauty/page.tsx), styled for
 * this Dialect B portal instead of reusing Tailwind `w-*` classes.
 */
export function PhasePlaceholder({ icon: Icon, title, description }: PhasePlaceholderProps) {
  return (
    <div>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        {title}
      </h1>
      <div
        className="card"
        style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        <Icon size={28} color="var(--gold)" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 360 }}>{description}</p>
        <span
          style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-section)',
            borderRadius: 4, padding: '2px 8px', letterSpacing: 0.5,
          }}
        >
          Coming Soon
        </span>
      </div>
    </div>
  )
}
