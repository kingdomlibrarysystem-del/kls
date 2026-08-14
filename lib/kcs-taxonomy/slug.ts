/** Slugifies a string — ported verbatim from the old categories-data.ts. */
export function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
