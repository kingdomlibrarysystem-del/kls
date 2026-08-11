import { NextResponse } from 'next/server'

/** Thrown deliberately by a route handler to return a specific status/message instead of a generic 500 — see withErrorHandling's catch branch. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface StructuredLogFields {
  route: string
  method: string
  [key: string]: unknown
}

/** Minimal structured logger — a single console.error call with a consistent, greppable JSON shape, since no external log aggregator (Sentry, Datadog, etc.) is wired into this project yet. Kept in one place so upgrading to a real provider later is a one-file change. */
export function logApiError(fields: StructuredLogFields, error: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    ...fields,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
  }))
}

/**
 * Wraps a route handler so every unhandled error is logged with
 * consistent structure and returns the project's standard
 * {data,message,code,status} error shape, instead of each route
 * hand-rolling its own bare `catch { return 500 }`. An `ApiError` thrown
 * inside the handler is treated as an intentional, specific response
 * (its own message/status); anything else logs the full error and
 * returns a generic message — real error detail belongs in the log,
 * not in a response an end user or attacker can read.
 */
export function withErrorHandling<Args extends unknown[]>(
  route: string,
  method: string,
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ data: null, message: error.message, code: 'error', status: error.status }, { status: error.status })
      }
      logApiError({ route, method }, error)
      return NextResponse.json({ data: null, message: 'An unexpected error occurred. Please try again.', code: 'error', status: 500 }, { status: 500 })
    }
  }
}
