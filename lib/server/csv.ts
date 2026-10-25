/**
 * Builds a CSV file that opens correctly in Excel and Google Sheets: a UTF-8
 * BOM (so accents and Kinyarwanda letters show correctly), CRLF line ends,
 * and every cell quoted when it contains a comma, quote or line break.
 * Cells starting with = + - @ are prefixed with ' so a spreadsheet never runs
 * them as formulas (CSV injection).
 */
export type CsvCell = string | number | boolean | Date | null | undefined

function cell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  let s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  if (/^[=+\-@]/.test(s) && typeof value === 'string') s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
