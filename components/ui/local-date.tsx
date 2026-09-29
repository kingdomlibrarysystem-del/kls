interface LocalDateProps {
  value: string | number | Date
  /** 'date' -> toLocaleDateString, 'datetime' -> toLocaleString, 'time' -> toLocaleTimeString. */
  mode?: 'date' | 'datetime' | 'time'
  options?: Intl.DateTimeFormatOptions
  className?: string
}

/**
 * Locale-formatted date that is safe to render on the server. The server
 * (UTC, server locale) and the browser (user's timezone/locale) can format
 * the same instant differently, which would be a hydration mismatch now that
 * detail pages render their data on the server instead of after a client
 * fetch. suppressHydrationWarning lets the browser's own formatting win
 * without React discarding the server-rendered tree.
 */
export function LocalDate({ value, mode = 'date', options, className }: LocalDateProps) {
  const d = new Date(value)
  const text = mode === 'datetime'
    ? d.toLocaleString(undefined, options)
    : mode === 'time'
      ? d.toLocaleTimeString(undefined, options)
      : d.toLocaleDateString(undefined, options)
  return <span className={className} suppressHydrationWarning>{text}</span>
}
