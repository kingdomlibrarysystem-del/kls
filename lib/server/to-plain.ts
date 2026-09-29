/**
 * Converts a server-side value (Prisma rows with Date objects, etc.) into
 * exactly the JSON shape the matching /api/* route would have returned —
 * Dates become ISO strings, undefined keys disappear. Use it when a server
 * page passes data to a client component that was written against the API
 * response shape, so both paths stay byte-for-byte identical.
 */
export function toPlain<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T
}
