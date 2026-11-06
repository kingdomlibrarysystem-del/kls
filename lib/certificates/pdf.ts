import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Printable certificate of completion (A4 landscape) in the website's
 * colours: ink navy frame (#1a1a2e), gold rules (#d4a843 / #a07830) on a warm
 * cream page, the Kingdom Library logo, a gold seal, and a QR code that opens
 * the public verification page (/certificate/verify/<code>).
 */
const INK = rgb(0x1a / 255, 0x1a / 255, 0x2e / 255)
const GOLD = rgb(0xd4 / 255, 0xa8 / 255, 0x43 / 255)
const DEEP_GOLD = rgb(0xa0 / 255, 0x78 / 255, 0x30 / 255)
const CREAM = rgb(0xfb / 255, 0xf7 / 255, 0xee / 255)
const MUTED = rgb(0x5c / 255, 0x55 / 255, 0x48 / 255)
const RED = rgb(0.75, 0.12, 0.12)

export interface CertificatePdfInput {
  memberName: string
  courseTitle: string
  issuedAt: Date
  verificationCode: string
  revoked: boolean
}

/** Standard PDF fonts only cover Latin text — replace anything else so a name never breaks the file. */
function safe(text: string, font: PDFFont): string {
  try { font.encodeText(text); return text } catch {
    const plain = text.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    return [...plain].map((ch) => { try { font.encodeText(ch); return ch } catch { return '?' } }).join('')
  }
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const t = safe(text, font)
  page.drawText(t, { x: (page.getWidth() - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color })
}

/** Largest size (down to min) at which the text fits the width. */
function fitSize(text: string, font: PDFFont, max: number, min: number, width: number): number {
  let size = max
  while (size > min && font.widthOfTextAtSize(safe(text, font), size) > width) size -= 1
  return size
}

/** Up to `maxLines` lines that fit the width (the last one shortened with … if needed). */
function wrap(text: string, font: PDFFont, size: number, width: number, maxLines: number): string[] {
  const words = safe(text, font).split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= width) line = next
    else { if (line) lines.push(line); line = w }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (font.widthOfTextAtSize(`${last}…`, size) > width && last.length > 1) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last}…`
    return kept
  }
  return lines
}

function diamond(page: PDFPage, x: number, y: number, r: number, color = GOLD) {
  page.drawSvgPath(`M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`, { x, y, color })
}

export async function buildCertificatePdf(c: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Certificate of Completion — ${c.courseTitle}`)
  pdf.setAuthor('Kingdom Library')
  pdf.setSubject(`${c.memberName} — ${c.courseTitle}`)
  const page = pdf.addPage([841.89, 595.28])
  const W = page.getWidth()
  const H = page.getHeight()

  const [serif, serifBold, serifItalic, serifBoldItalic, sans, sansBold] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.TimesRomanBold),
    pdf.embedFont(StandardFonts.TimesRomanItalic),
    pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
  ])

  // Page and frames.
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM })
  page.drawRectangle({ x: 16, y: 16, width: W - 32, height: H - 32, borderColor: INK, borderWidth: 8 })
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 1.6 })
  page.drawRectangle({ x: 36, y: 36, width: W - 72, height: H - 72, borderColor: GOLD, borderWidth: 0.6 })
  for (const [x, y] of [[36, 36], [W - 36, 36], [36, H - 36], [W - 36, H - 36]]) diamond(page, x, y, 7)

  // Logo.
  try {
    const logo = await pdf.embedJpg(await readFile(path.join(process.cwd(), 'public', 'kls-logo.jpg')))
    const { width: lw, height: lh } = logo.scaleToFit(96, 60)
    page.drawImage(logo, { x: (W - lw) / 2, y: H - 58 - lh, width: lw, height: lh })
  } catch { /* logo missing — the certificate still renders */ }

  centered(page, 'K I N G D O M   L I B R A R Y', H - 138, sansBold, 10, DEEP_GOLD)
  centered(page, 'Certificate of Completion', H - 182, serifBold, 38, INK)

  // Divider with a diamond.
  page.drawLine({ start: { x: W / 2 - 150, y: H - 202 }, end: { x: W / 2 - 12, y: H - 202 }, thickness: 1, color: GOLD })
  page.drawLine({ start: { x: W / 2 + 12, y: H - 202 }, end: { x: W / 2 + 150, y: H - 202 }, thickness: 1, color: GOLD })
  diamond(page, W / 2, H - 202, 5)

  centered(page, 'This is to certify that', H - 240, serifItalic, 15, MUTED)
  const nameSize = fitSize(c.memberName, serifBoldItalic, 36, 20, W - 220)
  centered(page, c.memberName, H - 284, serifBoldItalic, nameSize, DEEP_GOLD)
  page.drawLine({ start: { x: W / 2 - 200, y: H - 296 }, end: { x: W / 2 + 200, y: H - 296 }, thickness: 0.8, color: GOLD })

  centered(page, 'has successfully completed the course', H - 324, serifItalic, 15, MUTED)
  const titleLines = wrap(c.courseTitle, serifBold, 22, W - 240, 2)
  titleLines.forEach((line, i) => centered(page, line, H - 358 - i * 26, serifBold, 22, INK))

  // Bottom row: verification (left), seal (centre), date & signature (right).
  const baseY = 70
  const verifyUrl = `${appBaseUrl().replace(/\/+$/, '')}/certificate/verify/${encodeURIComponent(c.verificationCode)}`
  try {
    const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 240, color: { dark: '#1a1a2e', light: '#fbf7ee' } })
    const qr = await pdf.embedPng(qrPng)
    page.drawImage(qr, { x: 70, y: baseY, width: 62, height: 62 })
  } catch { /* QR is a convenience — the code below still verifies */ }
  page.drawText('Certificate ID', { x: 142, y: baseY + 44, size: 8, font: sans, color: MUTED })
  page.drawText(safe(c.verificationCode, sansBold), { x: 142, y: baseY + 30, size: 11, font: sansBold, color: INK })
  page.drawText('Scan or visit to verify:', { x: 142, y: baseY + 14, size: 7.5, font: sans, color: MUTED })
  page.drawText(safe(verifyUrl.replace(/^https?:\/\//, ''), sans), { x: 142, y: baseY + 4, size: 7.5, font: sans, color: DEEP_GOLD })

  // Seal.
  const sx = W / 2
  const sy = baseY + 34
  page.drawCircle({ x: sx, y: sy, size: 40, color: GOLD })
  page.drawCircle({ x: sx, y: sy, size: 34, borderColor: CREAM, borderWidth: 1.2, color: GOLD })
  centered(page, 'KINGDOM', sy + 6, sansBold, 8, INK)
  centered(page, 'LIBRARY', sy - 4, sansBold, 8, INK)
  diamond(page, sx, sy - 16, 3.5, INK)

  // Date and signature line.
  const rx = W - 290
  const dateText = c.issuedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kigali' })
  page.drawText(dateText, { x: rx, y: baseY + 40, size: 13, font: serif, color: INK })
  page.drawLine({ start: { x: rx, y: baseY + 34 }, end: { x: rx + 120, y: baseY + 34 }, thickness: 0.8, color: INK })
  page.drawText('Date of issue', { x: rx, y: baseY + 22, size: 8, font: sans, color: MUTED })
  page.drawLine({ start: { x: rx + 140, y: baseY + 34 }, end: { x: rx + 220, y: baseY + 34 }, thickness: 0.8, color: INK })
  page.drawText('For Kingdom Library', { x: rx + 140, y: baseY + 22, size: 8, font: sans, color: MUTED })

  if (c.revoked) {
    const text = 'REVOKED'
    const size = 96
    const w = sansBold.widthOfTextAtSize(text, size)
    page.drawText(text, { x: W / 2 - w / 2 * 0.94, y: H / 2 - 140, size, font: sansBold, color: RED, opacity: 0.22, rotate: degrees(18) })
  }

  return pdf.save()
}
