import { describe, it, expect } from 'vitest'
import {
  damerauLevenshtein,
  inflectionCandidates,
  isKnownWord,
  markdownSkipRanges,
  normalizeWord,
  scanSpellIssues,
  suggestFor,
} from '../spellchecker'

describe('isKnownWord', () => {
  it('accepts plain common words', () => {
    expect(isKnownWord('the')).toBe(true)
    expect(isKnownWord('worship')).toBe(true)
    expect(isKnownWord('chapter')).toBe(true)
    expect(isKnownWord('ministry')).toBe(true)
    expect(isKnownWord('psalm')).toBe(true)
  })

  it('accepts common French words when asked in French', () => {
    expect(isKnownWord('voiture', 'FR')).toBe(true)
    expect(isKnownWord('maison', 'FR')).toBe(true)
    expect(isKnownWord("l'école", 'FR')).toBe(true)
    expect(isKnownWord("c'est", 'FR')).toBe(true)
    expect(isKnownWord("aujourd'hui", 'FR')).toBe(true)
    expect(isKnownWord('châteaux', 'FR')).toBe(true)
    expect(isKnownWord('bonjour', 'FR')).toBe(true)
  })

  it('keeps French and English dictionaries separate', () => {
    expect(isKnownWord('merci', 'EN')).toBe(false)
    expect(isKnownWord('worship', 'FR')).toBe(false)
  })

  it('rejects obvious typos', () => {
    expect(isKnownWord('teh')).toBe(false)
    expect(isKnownWord('recieve')).toBe(false)
    expect(isKnownWord('seperate')).toBe(false)
    expect(isKnownWord('definately')).toBe(false)
    expect(isKnownWord('bonnne', 'FR')).toBe(false)
    expect(isKnownWord('sheux', 'FR')).toBe(false)
  })

  it('accepts common contractions', () => {
    expect(isKnownWord("don't")).toBe(true)
    expect(isKnownWord("it's")).toBe(true)
    expect(isKnownWord("won't")).toBe(true)
    expect(isKnownWord("o'clock")).toBe(true)
  })

  it('accepts inflected/dictionary-long words via stem rules', () => {
    expect(isKnownWord('providing')).toBe(true)
    expect(isKnownWord('churches')).toBe(true)
    expect(isKnownWord('running')).toBe(true)
    expect(isKnownWord('stories')).toBe(true)
    expect(isKnownWord('helpers')).toBe(true)
  })

  it('treats totally unknown typing as misspelled', () => {
    expect(isKnownWord('kdsjfha')).toBe(false)
  })
})

describe('normalizeWord', () => {
  it('lowercases and trims surrounding punctuation', () => {
    expect(normalizeWord('Rwanda')).toBe('rwanda')
    expect(normalizeWord("Lord's")).toBe("lord's")
  })
})

describe('inflectionCandidates', () => {
  it('restores a dropped e after -ing', () => {
    expect(inflectionCandidates('providing')).toContain('provide')
  })
  it('maps -ies plurals back to -y', () => {
    expect(inflectionCandidates('churches')).toContain('church')
    expect(inflectionCandidates('stories')).toContain('story')
  })
  it('strips common abstract-noun suffixes', () => {
    expect(inflectionCandidates('sanctification')).toContain('sanctific')
  })
})

describe('markdownSkipRanges', () => {
  it('flags fenced code blocks', () => {
    const text = 'before\n```js\nconst x = 1\n```\nafter'
    const ranges = markdownSkipRanges(text)
    expect(ranges.length).toBeGreaterThan(0)
    const covered = scanSpellIssues(text)
    expect(covered.some((i) => i.word === 'const')).toBe(false)
  })

  it('skips inline code spans, urls and html comments but checks link text', () => {
    const text = 'see `thsi` now and [that teh link](https://example.com/xq) plus <!-- kcs-style:{align:"left"} -->'
    const issues = scanSpellIssues(text)
    expect(issues.some((i) => i.word === 'thsi')).toBe(false)
    expect(issues.some((i) => i.word === 'example')).toBe(false)
    expect(issues.some((i) => i.word === 'teh')).toBe(true)
  })
})

describe('scanSpellIssues', () => {
  it('returns the misspelled word with correct offsets', () => {
    const text = 'The teh quick'
    const issues = scanSpellIssues(text)
    expect(issues).toHaveLength(1)
    expect(issues[0].word).toBe('teh')
    expect(text.slice(issues[0].start, issues[0].end)).toBe('teh')
    expect(issues[0].start).toBe(4)
    expect(issues[0].end).toBe(7)
  })

  it('flags each typographical occurrence separately', () => {
    const issues = scanSpellIssues('teh cat and teh dog')
    expect(issues.filter((i) => i.word === 'teh')).toHaveLength(2)
  })

  it('flags French typos in French mode', () => {
    const text = 'Une belle ancienne maisnn'
    const issues = scanSpellIssues(text, new Set(), 'FR')
    expect(issues.some((i) => i.word === 'maisnn')).toBe(true)
    expect(issues.some((i) => i.word === 'belle')).toBe(false)
  })

  it('does not flag valid French sentences in French mode', () => {
    const text = "L'église est belle aujourd'hui"
    const issues = scanSpellIssues(text, new Set(), 'FR')
    expect(issues).toHaveLength(0)
  })

  it('ignores words in the ignore set', () => {
    const issues = scanSpellIssues('teh cat', new Set(['teh']))
    expect(issues).toHaveLength(0)
  })

  it('skips all-caps acronyms but checks normal capitalized words', () => {
    const text = 'The KCS and the Teh'
    const issues = scanSpellIssues(text)
    expect(issues.some((i) => i.word === 'KCS')).toBe(false)
    expect(issues.some((i) => i.word === 'Teh')).toBe(true)
  })
})

describe('suggestFor', () => {
  it('suggests common near-matches for a typo', () => {
    expect(suggestFor('teh', 20)).toContain('the')
    expect(suggestFor('recieve', 20)).toContain('receive')
  })

  it('matches accented French suggestions across missing accents', () => {
    expect(suggestFor('ecole', 10, 'FR')).toContain('école')
  })

  it('suggests French corrections with their accents', () => {
    expect(suggestFor('jeurnee', 10, 'FR')).toContain('journée')
  })
})

describe('damerauLevenshtein', () => {
  it('counts edits including transpositions', () => {
    expect(damerauLevenshtein('teh', 'the')).toBe(1)
    expect(damerauLevenshtein('cat', 'cat')).toBe(0)
    expect(damerauLevenshtein('abc', 'axc')).toBe(1)
    expect(damerauLevenshtein('abcdef', 'zzzz')).toBe(3)
  })
})