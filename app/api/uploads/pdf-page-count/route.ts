import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Real page count for an already-uploaded PDF, fetched server-side by
 * URL — used after CldUploadWidget (client-side, unsigned preset)
 * uploads a document directly to Cloudinary, since that path never
 * passes through this app's own /api/uploads route (the one place
 * page counting previously happened, during a server-side upload).
 * Same extraction logic (pdfjs-dist's Node-compatible legacy build);
 * failure to parse degrades to `pages: undefined` rather than blocking
 * the form — page count is a convenience auto-fill, not a requirement.
 */
async function countPdfPages(buffer: ArrayBuffer): Promise<number | undefined> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    return doc.numPages
  } catch {
    return undefined
  }
}

const bodySchema = z.object({ url: z.string().url('A valid document URL is required') })

export const POST = withErrorHandling('/api/uploads/pdf-page-count', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const res = await fetch(parsed.data.url)
  if (!res.ok) throw new ApiError('Could not fetch the uploaded document', 502)
  const buffer = await res.arrayBuffer()
  const pages = await countPdfPages(buffer)

  return NextResponse.json({ data: { pages }, message: 'Page count extracted', code: 'success', status: 200 })
})
