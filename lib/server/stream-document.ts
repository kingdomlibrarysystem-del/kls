import { NextResponse } from 'next/server'

/**
 * Sends a remote file (Cloudinary) through our API WITHOUT loading it all into
 * memory first, and passes the browser's `Range` request on. The PDF reader
 * (pdf.js) uses ranges to fetch only the bytes of the pages it needs, so the
 * first page shows after a few hundred KB instead of after the whole book has
 * downloaded — previously the server buffered the entire file, then sent it.
 */
export async function streamRemoteFile(
  sourceUrl: string,
  request: Request,
  headers: { contentType: string; disposition?: string },
): Promise<NextResponse | null> {
  const range = request.headers.get('range')
  const source = await fetch(sourceUrl, range ? { headers: { Range: range } } : undefined)
  if (!source.ok || !source.body) return null

  const out = new Headers({
    'Content-Type': headers.contentType,
    'Accept-Ranges': 'bytes',
    // Private to this browser (access depends on the member); a short reuse makes re-opening the book instant.
    'Cache-Control': 'private, max-age=300',
  })
  for (const name of ['content-length', 'content-range']) {
    const value = source.headers.get(name)
    if (value) out.set(name, value)
  }
  if (headers.disposition) out.set('Content-Disposition', headers.disposition)
  return new NextResponse(source.body, { status: source.status === 206 ? 206 : 200, headers: out })
}
