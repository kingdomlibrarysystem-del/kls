interface SkeletonProps {
  /** Tailwind utility classes for sizing/shape/color in Dialect A contexts (e.g. "h-4 w-32 rounded"). */
  className?: string
  /** Inline style overrides for Dialect B contexts (e.g. { width: 120, height: 16, background: 'var(--bg-hover)' }). */
  style?: React.CSSProperties
}

/**
 * Generic pulsing-rectangle loading placeholder. Works in both style dialects:
 * pass `className` for Tailwind sizing/color (Dialect A) or `style` for
 * CSS-var-driven sizing/color (Dialect B). If neither supplies a background,
 * falls back to `var(--bg-hover)` so the skeleton is visible in either dialect.
 * Uses a 1.8s pulse to match the codebase's subtle, snappy transition feel.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  const hasBackground = className?.includes('bg-') || style?.background || style?.backgroundColor
  return (
    <div
      className={`animate-pulse rounded ${className ?? ''}`}
      style={{
        ...(hasBackground ? {} : { background: 'var(--bg-hover, rgba(0,0,0,0.06))' }),
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
