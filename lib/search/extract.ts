/**
 * Takes the text out of an uploaded document so it can be searched.
 * PDF → one entry per page (with its page number); Word (.docx) → the whole
 * text, split into parts. Other files (PowerPoint, images, audio…) and
 * scanned PDFs (pictures of pages, no text inside) give nothing.
 */
import { chunkText, cleanText } from './text'

export interface ExtractedPart {
  /** Page number in the file (PDF only). */
  page: number | null
  text: string
}

/** Stop reading after this many pages / characters, so one giant file cannot stall a save. */
const MAX_PAGES = 1500
const MAX_CHARS = 6_000_000
const FETCH_TIMEOUT_MS = 90_000

export async function extractDocumentText(url: string): Promise<ExtractedPart[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Could not download the file (${res.status})`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const head = String.fromCharCode(...bytes.slice(0, 5))

  if (head.startsWith('%PDF')) return extractPdf(bytes)
  // A .docx is a zip ("PK"); if it is another kind of zip (.pptx…) mammoth fails and we index nothing.
  if (head.startsWith('PK')) {
    try { return await extractDocx(bytes) } catch { return [] }
  }
  return []
}

async function extractPdf(bytes: Uint8Array): Promise<ExtractedPart[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Load pdf.js's worker code in this process (no separate worker on the server);
  // importing it here also makes sure the file ships with the server build.
  const g = globalThis as { pdfjsWorker?: unknown }
  if (!g.pdfjsWorker) g.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs')

  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false, verbosity: 0 }).promise
  const parts: ExtractedPart[] = []
  let total = 0
  try {
    for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES) && total < MAX_CHARS; n++) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      let text = ''
      for (const item of content.items) {
        if (!('str' in item)) continue
        text += item.str + (item.hasEOL ? '\n' : ' ')
      }
      page.cleanup()
      text = cleanText(text)
      if (text.length > 0) {
        parts.push({ page: n, text })
        total += text.length
      }
    }
  } finally {
    await doc.destroy()
  }
  return parts
}

async function extractDocx(bytes: Uint8Array): Promise<ExtractedPart[]> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
  return chunkText(cleanText(value).slice(0, MAX_CHARS)).map((text) => ({ page: null, text }))
}
