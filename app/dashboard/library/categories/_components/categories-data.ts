export interface Category {
  id: string
  slug: string
  name: { en: string; fr: string; rw: string }
  parentId: string | null
  parentName: string | null
  resourceCount: number
  createdAt: string
}

export interface FormState {
  nameEn: string
  nameFr: string
  nameRw: string
  slug: string
  parentId: string
}

export const EMPTY_FORM: FormState = { nameEn: '', nameFr: '', nameRw: '', slug: '', parentId: '' }

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
  { slug: 'genesis', name: { en: 'Genesis', fr: 'Genèse', rw: 'Itangiriro' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'exodus', name: { en: 'Exodus', fr: 'Exode', rw: 'Kuva' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'leviticus', name: { en: 'Leviticus', fr: 'Lévitique', rw: 'Abalewi' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'numbers', name: { en: 'Numbers', fr: 'Nombres', rw: 'Imibare' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
  { slug: 'deuteronomy', name: { en: 'Deuteronomy', fr: 'Deutéronome', rw: 'Gutegeka kwa Kabiri' }, parentSlug: 'kcs-fnd', parentNameEn: 'Foundation (KCS-FND)' },
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
  { slug: 'psalms', name: { en: 'Psalms', fr: 'Psaumes', rw: 'Zaburi' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'proverbs', name: { en: 'Proverbs', fr: 'Proverbes', rw: 'Imigani' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'ecclesiastes', name: { en: 'Ecclesiastes', fr: 'Ecclésiaste', rw: 'Umubwiriza' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'song-of-songs', name: { en: 'Song of Songs', fr: 'Cantique des Cantiques', rw: 'Indirimbo y\'Indirimbo' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'wisdom-of-solomon', name: { en: 'Wisdom of Solomon', fr: 'Sagesse de Salomon', rw: 'Ubwenge bwa Salomo' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
  { slug: 'sirach', name: { en: 'Sirach (Ecclesiasticus)', fr: 'Siracide (Ecclésiastique)', rw: 'Siraki' }, parentSlug: 'kcs-wis', parentNameEn: 'Wisdom (KCS-WIS)' },
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
  { slug: 'matthew', name: { en: 'Matthew', fr: 'Matthieu', rw: 'Matayo' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'mark', name: { en: 'Mark', fr: 'Marc', rw: 'Mariko' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'luke', name: { en: 'Luke', fr: 'Luc', rw: 'Luka' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'john', name: { en: 'John', fr: 'Jean', rw: 'Yohana' }, parentSlug: 'kcs-gos', parentNameEn: 'Gospel (KCS-GOS)' },
  { slug: 'acts', name: { en: 'Acts of the Apostles', fr: 'Actes des Apôtres', rw: 'Ibyakozwe n\'Intumwa' }, parentSlug: 'kcs-act', parentNameEn: 'Acts (KCS-ACT)' },
  { slug: 'your-scroll-acts', name: { en: 'Your Scroll (Acts)', fr: 'Votre Rouleau (Actes)', rw: 'Uruzu rwawe (Ibyakozwe)' }, parentSlug: 'kcs-act', parentNameEn: 'Acts (KCS-ACT)' },
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
  { slug: 'revelation', name: { en: 'Revelation', fr: 'Apocalypse', rw: 'Ibyahishuwe' }, parentSlug: 'kcs-rev', parentNameEn: 'Revelation (KCS-REV)' },
  { slug: 'your-scroll-rev', name: { en: 'Your Scroll (Revelation)', fr: 'Votre Rouleau (Révélation)', rw: 'Uruzu rwawe (Ibyahishuwe)' }, parentSlug: 'kcs-rev', parentNameEn: 'Revelation (KCS-REV)' },
]

export const mockCategories: Category[] = [
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

export function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
