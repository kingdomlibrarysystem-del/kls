'use client'

import { useState } from 'react'
import { FolderOpen, Pencil, Trash2, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ElegantButton } from '@/components/ui/elegant-button'
import { Modal } from '@/components/ui/modal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  slug: string
  name: { en: string; fr: string; rw: string }
  parentId: string | null
  parentName: string | null
  resourceCount: number
  createdAt: string
}

interface FormState {
  nameEn: string
  nameFr: string
  nameRw: string
  slug: string
  parentId: string
}

const EMPTY_FORM: FormState = { nameEn: '', nameFr: '', nameRw: '', slug: '', parentId: '' }

// ── Mock data – KCS taxonomy (replace with real API call per PERFORMANCE.md Rule 2) ──
// Kingdom Classification System – 8 root sections, each containing its scrolls as sub-categories

const kcsRoots: Omit<Category, 'id'>[] = [
  { slug: 'kcs-fnd', name: { en: 'Foundation (KCS-FND)', fr: 'Fondation (KCS-FND)', rw: 'Ishingiro (KCS-FND)' }, parentId: null, parentName: null, resourceCount: 5, createdAt: '2024-01-01' },
  { slug: 'kcs-his', name: { en: 'History (KCS-HIS)', fr: 'Histoire (KCS-HIS)', rw: 'Amateka (KCS-HIS)' }, parentId: null, parentName: null, resourceCount: 22, createdAt: '2024-01-01' },
  { slug: 'kcs-wis', name: { en: 'Wisdom (KCS-WIS)', fr: 'Sagesse (KCS-WIS)', rw: 'Ubwenge (KCS-WIS)' }, parentId: null, parentName: null, resourceCount: 7, createdAt: '2024-01-01' },
  { slug: 'kcs-prp', name: { en: 'Prophetic (KCS-PRP)', fr: 'Prophétique (KCS-PRP)', rw: 'Ubuhanuzi (KCS-PRP)' }, parentId: null, parentName: null, resourceCount: 23, createdAt: '2024-01-01' },
  { slug: 'kcs-gos', name: { en: 'Gospel (KCS-GOS)', fr: 'Évangile (KCS-GOS)', rw: 'Ivanjili (KCS-GOS)' }, parentId: null, parentName: null, resourceCount: 4, createdAt: '2024-01-01' },
  { slug: 'kcs-act', name: { en: 'Acts (KCS-ACT)', fr: 'Actes (KCS-ACT)', rw: 'Ibyakozwe (KCS-ACT)' }, parentId: null, parentName: null, resourceCount: 2, createdAt: '2024-01-01' },
  { slug: 'kcs-epi', name: { en: 'Epistles (KCS-EPI)', fr: 'Épîtres (KCS-EPI)', rw: 'Intumwa (KCS-EPI)' }, parentId: null, parentName: null, resourceCount: 22, createdAt: '2024-01-01' },
  { slug: 'kcs-rev', name: { en: 'Revelation (KCS-REV)', fr: 'Révélation (KCS-REV)', rw: 'Ibyahishuwe (KCS-REV)' }, parentId: null, parentName: null, resourceCount: 2, createdAt: '2024-01-01' },
]

const kcsSubs: { slug: string; name: { en: string; fr: string; rw: string }; parentSlug: string; parentNameEn: string }[] = [
  // Foundation scrolls
  { slug: 'genesis', name: { en: 'Genesis', fr: 'Genèse', rw: 'Itangiriro' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'exodus', name: { en: 'Exodus', fr: 'Exode', rw: 'Kuva' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'leviticus', name: { en: 'Leviticus', fr: 'Lévitique', rw: 'Abalewi' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'numbers', name: { en: 'Numbers', fr: 'Nombres', rw: 'Imibare' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'deuteronomy', name: { en: 'Deuteronomy', fr: 'Deutéronome', rw: 'Gutegeka kwa Kabiri' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  // History scrolls
  { slug: 'joshua', name: { en: 'Joshua', fr: 'Josué', rw: 'Yosuwa' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'judges', name: { en: 'Judges', fr: 'Juges', rw: 'Abacamanza' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'ruth', name: { en: 'Ruth', fr: 'Ruth', rw: 'Rusi' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '1-samuel', name: { en: '1 Samuel', fr: '1 Samuel', rw: '1 Samweli' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '2-samuel', name: { en: '2 Samuel', fr: '2 Samuel', rw: '2 Samweli' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '1-kings', name: { en: '1 Kings', fr: '1 Rois', rw: '1 Abami' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '2-kings', name: { en: '2 Kings', fr: '2 Rois', rw: '2 Abami' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '1-chronicles', name: { en: '1 Chronicles', fr: '1 Chroniques', rw: '1 Ngoma' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '2-chronicles', name: { en: '2 Chronicles', fr: '2 Chroniques', rw: '2 Ngoma' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'ezra', name: { en: 'Ezra', fr: 'Esdras', rw: 'Ezira' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'nehemiah', name: { en: 'Nehemiah', fr: 'Néhémie', rw: 'Nehemiya' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'esther', name: { en: 'Esther', fr: 'Esther', rw: 'Esiteri' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'job', name: { en: 'Job', fr: 'Job', rw: 'Yobu' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'jubilees', name: { en: 'Jubilees', fr: 'Jubilés', rw: 'Yubile' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'enoch', name: { en: 'Enoch (1 Enoch)', fr: 'Hénoch (1 Hénoch)', rw: 'Enoki (1 Enoki)' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'tobit', name: { en: 'Tobit', fr: 'Tobie', rw: 'Tobiti' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: 'judith', name: { en: 'Judith', fr: 'Judith', rw: 'Yuditi' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '1-maccabees', name: { en: '1 Maccabees', fr: '1 Maccabées', rw: '1 Makabayi' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  { slug: '2-maccabees', name: { en: '2 Maccabees', fr: '2 Maccabées', rw: '2 Makabayi' }, parentSlug: 'kcs-his', parentNameEn: 'History (KCS-HIS)' },
  // Wisdom scrolls
  { slug: 'psalms', name: { en: 'Psalms', fr: 'Psaumes', rw: 'Zaburi' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'proverbs', name: { en: 'Proverbs', fr: 'Proverbes', rw: 'Imigani' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'ecclesiastes', name: { en: 'Ecclesiastes', fr: 'Ecclésiaste', rw: 'Umubwiriza' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'song-of-songs', name: { en: 'Song of Songs', fr: 'Cantique des Cantiques', rw: 'Indirimbo y\'Indirimbo' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'wisdom-of-solomon', name: { en: 'Wisdom of Solomon', fr: 'Sagesse de Salomon', rw: 'Ubwenge bwa Salomo' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'sirach', name: { en: 'Sirach (Ecclesiasticus)', fr: 'Siracide (Ecclésiastique)', rw: 'Siraki' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  // Prophetic scrolls
  { slug: 'isaiah', name: { en: 'Isaiah', fr: 'Isaïe', rw: 'Yesaya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'jeremiah', name: { en: 'Jeremiah', fr: 'Jérémie', rw: 'Yeremiya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'lamentations', name: { en: 'Lamentations', fr: 'Lamentations', rw: 'Kubirira' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'baruch', name: { en: 'Baruch', fr: 'Baruch', rw: 'Baruki' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'ezekiel', name: { en: 'Ezekiel', fr: 'Ézéchiel', rw: 'Ezekiyeli' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'daniel', name: { en: 'Daniel', fr: 'Daniel', rw: 'Daniyeli' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'hosea', name: { en: 'Hosea', fr: 'Osée', rw: 'Hoseya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'joel', name: { en: 'Joel', fr: 'Joël', rw: 'Yoweli' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'amos', name: { en: 'Amos', fr: 'Amos', rw: 'Amosi' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'obadiah', name: { en: 'Obadiah', fr: 'Abdias', rw: 'Obadiya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'jonah', name: { en: 'Jonah', fr: 'Jonas', rw: 'Yona' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'micah', name: { en: 'Micah', fr: 'Michée', rw: 'Mika' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'nahum', name: { en: 'Nahum', fr: 'Nahum', rw: 'Nahumu' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'habakkuk', name: { en: 'Habakkuk', fr: 'Habacuc', rw: 'Habakuki' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'zephaniah', name: { en: 'Zephaniah', fr: 'Sophonie', rw: 'Zefaniya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'haggai', name: { en: 'Haggai', fr: 'Aggée', rw: 'Hagayi' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'zechariah', name: { en: 'Zechariah', fr: 'Zacharie', rw: 'Zekariya' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  { slug: 'malachi', name: { en: 'Malachi', fr: 'Malachie', rw: 'Malaki' }, parentSlug: 'kcs-prp', parentNameEn: 'Prophetic (KCS-PRP)' },
  // Gospel scrolls
  { slug: 'matthew', name: { en: 'Matthew', fr: 'Matthieu', rw: 'Matayo' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'mark', name: { en: 'Mark', fr: 'Marc', rw: 'Mariko' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'luke', name: { en: 'Luke', fr: 'Luc', rw: 'Luka' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'john', name: { en: 'John', fr: 'Jean', rw: 'Yohana' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  // Acts scrolls
  { slug: 'acts', name: { en: 'Acts of the Apostles', fr: 'Actes des Apôtres', rw: 'Ibyakozwe n\'Intumwa' }, parentSlug: 'kcs-act', parentNameEn: 'Acts (KCS-ACT)' },
  { slug: 'your-scroll-acts', name: { en: 'Your Scroll (Acts)', fr: 'Votre Rouleau (Actes)', rw: 'Uruzu rwawe (Ibyakozwe)' }, parentSlug: 'kcs-act', parentNameEn: 'Acts (KCS-ACT)' },
  // Epistles scrolls
  { slug: 'romans', name: { en: 'Romans', fr: 'Romains', rw: 'Abaroma' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '1-corinthians', name: { en: '1 Corinthians', fr: '1 Corinthiens', rw: '1 Abakorinto' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '2-corinthians', name: { en: '2 Corinthians', fr: '2 Corinthiens', rw: '2 Abakorinto' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'galatians', name: { en: 'Galatians', fr: 'Galates', rw: 'Abagalatia' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'ephesians', name: { en: 'Ephesians', fr: 'Éphésiens', rw: 'Abefeso' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'philippians', name: { en: 'Philippians', fr: 'Philippiens', rw: 'Abafilipi' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'colossians', name: { en: 'Colossians', fr: 'Colossiens', rw: 'Abakolosayi' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '1-thessalonians', name: { en: '1 Thessalonians', fr: '1 Thessaloniciens', rw: '1 Abatesalonike' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '2-thessalonians', name: { en: '2 Thessalonians', fr: '2 Thessaloniciens', rw: '2 Abatesalonike' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '1-timothy', name: { en: '1 Timothy', fr: '1 Timothée', rw: '1 Timoteyo' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '2-timothy', name: { en: '2 Timothy', fr: '2 Timothée', rw: '2 Timoteyo' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'titus', name: { en: 'Titus', fr: 'Tite', rw: 'Tito' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'philemon', name: { en: 'Philemon', fr: 'Philémon', rw: 'Filemoni' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'hebrews', name: { en: 'Hebrews', fr: 'Hébreux', rw: 'Abaheburayo' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'james', name: { en: 'James', fr: 'Jacques', rw: 'Yakobo' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '1-peter', name: { en: '1 Peter', fr: '1 Pierre', rw: '1 Petero' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '2-peter', name: { en: '2 Peter', fr: '2 Pierre', rw: '2 Petero' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '1-john', name: { en: '1 John', fr: '1 Jean', rw: '1 Yohana' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '2-john', name: { en: '2 John', fr: '2 Jean', rw: '2 Yohana' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: '3-john', name: { en: '3 John', fr: '3 Jean', rw: '3 Yohana' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'jude', name: { en: 'Jude', fr: 'Jude', rw: 'Yuda' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  { slug: 'your-scroll-epi', name: { en: 'Your Scroll (Epistles)', fr: 'Votre Rouleau (Épîtres)', rw: 'Uruzu rwawe (Intumwa)' }, parentSlug: 'kcs-epi', parentNameEn: 'Epistles (KCS-EPI)' },
  // Revelation scrolls
  { slug: 'revelation', name: { en: 'Revelation', fr: 'Apocalypse', rw: 'Ibyahishuwe' }, parentSlug: 'kcs-rev', parentNameEn: 'Revelation (KCS-REV)' },
  { slug: 'your-scroll-rev', name: { en: 'Your Scroll (Revelation)', fr: 'Votre Rouleau (Révélation)', rw: 'Uruzu rwawe (Ibyahishuwe)' }, parentSlug: 'kcs-rev', parentNameEn: 'Revelation (KCS-REV)' },
]

const mockCategories: Category[] = [
  ...kcsRoots.map((r, i) => ({ id: `root-${i + 1}`, ...r })),
  ...kcsSubs.map((s, i) => ({
    id: `sub-${i + 1}`,
    slug: s.slug,
    name: s.name,
    parentId: `root-${kcsRoots.findIndex((r) => r.slug === s.parentSlug) + 1}`,
    parentName: s.parentNameEn,
    resourceCount: 0,
    createdAt: '2024-01-01',
  })),
]

// ── Slug generator ────────────────────────────────────────────────────────────

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Field label component ─────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-lato text-xs font-semibold text-w-700 dark:text-white/60 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function inputCls(hasError?: boolean) {
  return `w-full px-3 py-2 font-lato text-sm border rounded focus:outline-none transition-colors
    bg-white dark:bg-white/5 text-w-950 dark:text-white
    placeholder:text-w-400 dark:placeholder:text-white/30
    ${hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-w-400 dark:border-white/10 focus:border-w-600 dark:focus:border-w-600'
    }`
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors]         = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Auto-generate slug from EN name
  const handleNameEn = (value: string) => {
    setForm((f) => ({ ...f, nameEn: value, slug: toSlug(value) }))
    setErrors((e) => ({ ...e, nameEn: '', slug: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<FormState> = {}
    if (!form.nameEn.trim()) e.nameEn = 'English name is required'
    if (!form.slug.trim())   e.slug   = 'Slug is required'
    const slugExists = categories.some(
      (c) => c.slug === form.slug && c.id !== editTarget?.id
    )
    if (slugExists) e.slug = 'Slug already exists'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    setTimeout(() => {
      if (editTarget) {
        setCategories((prev) => prev.map((c) =>
          c.id === editTarget.id
            ? { ...c, slug: form.slug, name: { en: form.nameEn, fr: form.nameFr, rw: form.nameRw }, parentId: form.parentId || null, parentName: categories.find((x) => x.id === form.parentId)?.name.en ?? null }
            : c
        ))
        showToast(`Category "${form.nameEn}" updated.`)
        setEditTarget(null)
      } else {
        const newCat: Category = {
          id: crypto.randomUUID(),
          slug: form.slug,
          name: { en: form.nameEn, fr: form.nameFr || form.nameEn, rw: form.nameRw || form.nameEn },
          parentId: form.parentId || null,
          parentName: categories.find((c) => c.id === form.parentId)?.name.en ?? null,
          resourceCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        }
        setCategories((prev) => [newCat, ...prev])
        showToast(`Category "${form.nameEn}" created.`)
      }
      setForm(EMPTY_FORM)
      setSubmitting(false)
    }, 600)
  }

  const handleEdit = (cat: Category) => {
    setEditTarget(cat)
    setForm({ nameEn: cat.name.en, nameFr: cat.name.fr, nameRw: cat.name.rw, slug: cat.slug, parentId: cat.parentId ?? '' })
    setErrors({})
  }

  const handleCancelEdit = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.resourceCount > 0) {
      showToast(`Cannot delete — ${deleteTarget.resourceCount} resource(s) still assigned.`, 'error')
      setDeleteTarget(null)
      return
    }
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    showToast(`Category "${deleteTarget.name.en}" deleted.`)
    setDeleteTarget(null)
  }

  // ── Root categories (for parent selector, exclude self when editing) ────────
  const parentOptions = categories.filter(
    (c) => !c.parentId && c.id !== editTarget?.id
  )

  // ── DataTable columns ───────────────────────────────────────────────────────
  const columns: Column<Category>[] = [
    {
      key: 'name', label: 'Category', sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-w-100 dark:bg-white/10 flex items-center justify-center shrink-0">
            <FolderOpen size={13} className="text-w-600" />
          </div>
          <div>
            <p className="font-semibold text-w-950 dark:text-white text-sm">{c.name.en}</p>
            {c.parentName && (
              <p className="text-xs text-w-600 dark:text-white/40 flex items-center gap-0.5">
                <ChevronRight size={10} />{c.parentName}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'slug', label: 'Slug', sortable: true,
      render: (c) => (
        <span className="font-mono text-xs text-w-600 dark:text-white/50 bg-w-100 dark:bg-white/5 px-2 py-0.5 rounded">
          {c.slug}
        </span>
      ),
    },
    {
      key: 'name_fr', label: 'FR / RW',
      render: (c) => (
        <div className="text-xs text-w-700 dark:text-white/50 space-y-0.5">
          <p>{c.name.fr}</p>
          <p className="text-w-500 dark:text-white/30">{c.name.rw}</p>
        </div>
      ),
    },
    {
      key: 'resourceCount', label: 'Resources', sortable: true,
      render: (c) => (
        <span className={`font-cinzel font-bold text-sm ${c.resourceCount > 0 ? 'text-w-600' : 'text-w-400 dark:text-white/30'}`}>
          {c.resourceCount}
        </span>
      ),
    },
    {
      key: 'createdAt', label: 'Created', sortable: true,
      render: (c) => <span className="font-lato text-xs text-w-600 dark:text-white/40">{c.createdAt}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleEdit(c)}
            className="flex items-center gap-1 px-2.5 py-1 bg-w-100 dark:bg-white/5 text-w-950 dark:text-white/70 border border-w-300 dark:border-white/10 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => setDeleteTarget(c)}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-xs font-lato hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      ),
    },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="KCS Categories"
        subtitle="Kingdom Classification System — 8 root sections with their scrolls as sub-categories"
      />

      {/* Toast */}
      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded font-lato text-sm border ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── LEFT — Categories table ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-lato text-xs text-w-600 dark:text-white/50 uppercase tracking-wider font-semibold">
              {categories.length} categories total
            </p>
          </div>
          <DataTable<Category>
            data={categories}
            columns={columns}
            rowKey={(c) => c.id}
            searchPlaceholder="Search categories..."
            searchFilter={(c, q) =>
              c.name.en.toLowerCase().includes(q) ||
              c.name.fr.toLowerCase().includes(q) ||
              c.name.rw.toLowerCase().includes(q) ||
              c.slug.includes(q)
            }
            defaultPageSize={10}
            emptyMessage="No categories found."
          />
        </div>

        {/* ── RIGHT — Create / Edit form ──────────────────────────────────── */}
        <div className="bg-white dark:bg-white/5 border border-w-300 dark:border-white/10 rounded-lg p-5 sticky top-4">

          {/* Form header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-w-200 dark:border-white/10">
            <div>
              <h2 className="font-cinzel text-sm font-semibold text-w-950 dark:text-white tracking-wide">
                {editTarget ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="font-lato text-xs text-w-600 dark:text-white/40 mt-0.5">
                {editTarget ? `Editing: ${editTarget.name.en}` : 'Add a new library category'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-w-100 dark:bg-white/10 flex items-center justify-center">
              <FolderOpen size={16} className="text-w-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* English name */}
            <div>
              <FieldLabel required>Name (English)</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Philosophy"
                value={form.nameEn}
                onChange={(e) => handleNameEn(e.target.value)}
                className={inputCls(!!errors.nameEn)}
              />
              {errors.nameEn && <p className="mt-1 font-lato text-xs text-red-500">{errors.nameEn}</p>}
            </div>

            {/* Slug */}
            <div>
              <FieldLabel required>Slug</FieldLabel>
              <input
                type="text"
                placeholder="e.g. philosophy"
                value={form.slug}
                onChange={(e) => { setForm((f) => ({ ...f, slug: toSlug(e.target.value) })); setErrors((er) => ({ ...er, slug: '' })) }}
                className={inputCls(!!errors.slug)}
              />
              {errors.slug
                ? <p className="mt-1 font-lato text-xs text-red-500">{errors.slug}</p>
                : <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">Auto-generated · must be unique</p>
              }
            </div>

            {/* French name */}
            <div>
              <FieldLabel>Name (Français)</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Philosophie"
                value={form.nameFr}
                onChange={(e) => setForm((f) => ({ ...f, nameFr: e.target.value }))}
                className={inputCls()}
              />
            </div>

            {/* Kinyarwanda name */}
            <div>
              <FieldLabel>Name (Kinyarwanda)</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Filozofi"
                value={form.nameRw}
                onChange={(e) => setForm((f) => ({ ...f, nameRw: e.target.value }))}
                className={inputCls()}
              />
            </div>

            {/* Parent category */}
            <div>
              <FieldLabel>Parent Category</FieldLabel>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className={inputCls()}
              >
                <option value="">— None (root category) —</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.en}</option>
                ))}
              </select>
              <p className="mt-1 font-lato text-xs text-w-500 dark:text-white/30">
                Leave empty to create a root category
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <ElegantButton
                type="submit"
                variant="primary"
                loading={submitting}
                className="flex-1 text-sm py-2"
              >
                {editTarget ? 'Save Changes' : 'Create Category'}
              </ElegantButton>
              {editTarget && (
                <ElegantButton
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="text-sm py-2 px-4"
                >
                  Cancel
                </ElegantButton>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
      >
        {deleteTarget && (
          <div>
            <p className="font-lato text-sm text-w-700 dark:text-white/70 mb-2">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-w-950 dark:text-white">
                &ldquo;{deleteTarget.name.en}&rdquo;
              </span>?
            </p>
            {deleteTarget.resourceCount > 0 ? (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <p className="font-lato text-xs text-red-700 dark:text-red-400">
                  This category has {deleteTarget.resourceCount} resource(s) assigned. Reassign them first.
                </p>
              </div>
            ) : (
              <p className="font-lato text-xs text-w-600 dark:text-white/40 mb-4">
                This action cannot be undone.
              </p>
            )}
            <div className="flex gap-2">
              <ElegantButton
                variant="primary"
                onClick={handleDelete}
                disabled={deleteTarget.resourceCount > 0}
                className="flex-1 text-sm py-2 bg-red-600 border-red-700 hover:bg-red-700"
              >
                Delete
              </ElegantButton>
              <ElegantButton
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-sm py-2"
              >
                Cancel
              </ElegantButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
