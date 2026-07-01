import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** lucide-react icon component, e.g. `BookOpen`. */
  icon: LucideIcon
  /** Short heading, e.g. "No favorites yet". */
  title: string
  /** One-sentence supporting copy. */
  description: string
  /** Tailwind utility classes for the wrapping container in Dialect A contexts. */
  className?: string
  /** Inline style overrides for the wrapping container in Dialect B contexts. */
  style?: React.CSSProperties
}

/**
 * Non-table empty state: icon + title + description, centered. Use for empty
 * lists/grids (e.g. no favorites, no active courses) — `DataTable`'s own
 * `emptyMessage` prop already covers table-shaped empty states. Dialect-flexible:
 * pass `className` for Tailwind styling or `style` for CSS-var-driven styling.
 */
export function EmptyState({ icon: Icon, title, description, className, style }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className ?? ''}`}
      style={style}
    >
      <Icon size={28} className="text-w-400 dark:text-white/30" style={{ color: style ? 'var(--text-muted)' : undefined, marginBottom: 12 }} />
      <p className="font-cinzel text-sm font-semibold text-w-950 dark:text-white" style={style ? { color: 'var(--text-primary)' } : undefined}>
        {title}
      </p>
      <p className="font-lato text-xs text-w-700 dark:text-white/50 mt-1.5 max-w-xs" style={style ? { color: 'var(--text-secondary)' } : undefined}>
        {description}
      </p>
    </div>
  )
}
