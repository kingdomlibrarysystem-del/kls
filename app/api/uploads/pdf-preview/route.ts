import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Proxies a just-uploaded PDF back to the admin Resource form's inline
 * preview — the widget's own secure_url is a Cloudinary `raw` resource,
 * and fetching that directly from the browser can fail with a bare
 * "Failed to fetch" (Cloudinary's account-level PDF/ZIP delivery
 * setting, or any future access-control change, can block it) with no
 * useful diagnostic. Proxying through this staff-only route sidesteps
 * both the cross-origin fetch and any Cloudinary-side delivery
 * restriction. No entitlement gating is needed here (unlike the
 * member-facing /api/resources/[id]/document) — this is a QA preview
 * of the admin's own file, not a paywalled read.
 */
export const GET = withErrorHandling('/api/uploads/pdf-preview', 'GET', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const url = new URL(request.url).searchParams.get('url')
  if (!url) throw new ApiError('url is required', 400)

  const sourceRes = await fetch(url)
  if (!sourceRes.ok) throw new ApiError('Could not load this document', 502)
  const bytes = await sourceRes.arrayBuffer()

  return new NextResponse(bytes, { headers: { 'Content-Type': 'application/pdf' } })
})
