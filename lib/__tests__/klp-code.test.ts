import { describe, it, expect } from 'vitest'
import { buildKlpCode, buildLibraryId, checkDigit, defaultKlpFormat, formatLibraryId, isValidLibraryId, normalizeIsbn, suggestCollection } from '../klp-code'

/** The numbering rules of the "Kingdom Library Publication Code" document. */
describe('KLP code and Kingdom Library ID', () => {
  const example = { collection: '09', year: 26, sequence: 1, edition: 1, format: 'P' as const }

  it('builds the document examples exactly', () => {
    expect(buildKlpCode(example)).toBe('KLP-09-26-001-01-P')
    // Document example: 10 09 26 001 01 1 + check digit 7
    expect(buildLibraryId(example)).toBe('1009260010117')
    expect(formatLibraryId('1009260010117')).toBe('10 09 26 001 01 1 7')
    expect(checkDigit('100926001011')).toBe(7)
  })

  it('maps format letters to the numeric format digit (G/C/S share 9 "Other")', () => {
    expect(buildLibraryId({ ...example, format: 'A' }).slice(11, 12)).toBe('3')
    expect(buildLibraryId({ ...example, format: 'V' }).slice(11, 12)).toBe('7')
    expect(buildLibraryId({ ...example, format: 'C' }).slice(11, 12)).toBe('9')
    for (const format of ['P', 'E', 'A', 'D', 'R', 'J', 'V', 'M', 'G', 'C', 'S'] as const) {
      expect(isValidLibraryId(buildLibraryId({ ...example, format, sequence: 417, edition: 3 }))).toBe(true)
    }
  })

  it('rejects out-of-range parts instead of producing a malformed code', () => {
    expect(() => buildKlpCode({ ...example, sequence: 1000 })).toThrow()
    expect(() => buildKlpCode({ ...example, collection: '9' })).toThrow()
    expect(() => buildKlpCode({ ...example, edition: 0 })).toThrow()
  })

  it('a changed digit fails the check', () => {
    expect(isValidLibraryId('1009260010117')).toBe(true)
    expect(isValidLibraryId('1009260010118')).toBe(false)
    expect(isValidLibraryId('2009260010117')).toBe(false) // must start with 10
  })

  it('chooses a sensible default format from the files', () => {
    expect(defaultKlpFormat({ videoUrl: 'v.mp4', audioUrl: 'a.mp3' })).toBe('V')
    expect(defaultKlpFormat({ audioUrl: 'a.mp3' })).toBe('A')
    expect(defaultKlpFormat({ documentUrl: 'd.pdf' })).toBe('E')
    expect(defaultKlpFormat({ hasChapters: true })).toBe('E')
    expect(defaultKlpFormat({})).toBe('P')
  })

  it('validates official ISBNs and never accepts a Library ID as one', () => {
    expect(normalizeIsbn('978-0-306-40615-7')).toBe('9780306406157')
    expect(normalizeIsbn('0-306-40615-2')).toBe('0306406152')
    expect(normalizeIsbn('978-0-306-40615-8')).toBeNull()
    expect(normalizeIsbn('1009260010117')).toBeNull() // valid Library ID, but not a 978/979 ISBN
  })

  it('suggests the collection matching a KCS pillar name', () => {
    const cols = [{ code: '01', name: 'Foundation' }, { code: '09', name: 'Kingdom Life' }, { code: '10', name: 'Kingdom Health' }]
    expect(suggestCollection('Foundation', cols)).toBe('01')
    expect(suggestCollection('kingdom health', cols)).toBe('10')
    expect(suggestCollection('Genesis', cols)).toBe('')
  })
})
