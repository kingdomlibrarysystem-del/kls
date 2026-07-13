import type { ReactNode } from 'react'
import {
  ScrollText, History, Lightbulb, Radio, Heart, Rocket, BookCopy, Eye,
} from 'lucide-react'

export type ScrollStatus = 'AVAILABLE' | 'ARCHIVED'

export interface KcsSection {
  code: string
  label: string
  icon: ReactNode
  desc: string
  books: string[]
}

export interface ScrollSummary {
  id: string
  title: string
  code: string
  section: string
  status: ScrollStatus
}

/** Same 8 pillars as the admin KCS Map (/dashboard/kcs/*), member-facing summary only. */
export const kcsSections: KcsSection[] = [
  { code: 'KCS-FND', label: 'Foundation', icon: <ScrollText size={14} />, desc: 'Constitution of the Kingdom — Origins, Laws, Covenant', books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] },
  { code: 'KCS-HIS', label: 'History', icon: <History size={14} />, desc: 'Record of the Kingdom — Leadership, Patterns, Restorations', books: ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'] },
  { code: 'KCS-WIS', label: 'Wisdom', icon: <Lightbulb size={14} />, desc: 'Knowledge of the Kingdom — Life, Health, Prosperity', books: ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Songs'] },
  { code: 'KCS-PRP', label: 'Prophetic', icon: <Radio size={14} />, desc: 'Voice of the Kingdom — Correction, Promises, Hope', books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'] },
  { code: 'KCS-GOS', label: 'Gospel', icon: <Heart size={14} />, desc: "King's Manifestation — Nature, Authority, Model", books: ['Matthew', 'Mark', 'Luke', 'John'] },
  { code: 'KCS-ACT', label: 'Acts', icon: <Rocket size={14} />, desc: 'Kingdom Expansion — Birth, Power, Community', books: ['Acts of the Apostles'] },
  { code: 'KCS-EPI', label: 'Epistles', icon: <BookCopy size={14} />, desc: 'Kingdom Explained — Identity, Conduct, Structure', books: ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'] },
  { code: 'KCS-REV', label: 'Revelation', icon: <Eye size={14} />, desc: 'Kingdom Destiny — Throne, Judgment, Eternal', books: ['Revelation'] },
]

/**
 * Flattened per-book list, each with a stable id and a status. Every
 * canonical scroll is AVAILABLE — none are archived in this mock data —
 * matching the admin KCS Map's own scroll model, which likewise has no
 * per-book content/body field, only identity + status.
 */
export const allBooks: ScrollSummary[] = kcsSections.flatMap((section) =>
  section.books.map((title, i) => ({
    id: `${section.code}-${i}`,
    title,
    code: section.code,
    section: section.label,
    status: 'AVAILABLE' as ScrollStatus,
  }))
)
