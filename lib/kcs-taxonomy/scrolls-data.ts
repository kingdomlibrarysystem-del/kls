import type { Category, CategoryStatus } from './types'

/**
 * The 75 KCS child scrolls (Bible books), one level under their root
 * pillar. Multilingual names + slugs are sourced from `categories-data.ts`.
 * `status` is sourced from `kcs-pillars-data.ts`'s `Scroll.status` where a
 * matching title exists there; titles present only in `categories-data.ts`
 * (deuterocanonical/apocryphal books `kcs-pillars-data.ts` never listed —
 * Jubilees and Enoch are the exception, both already ARCHIVED there)
 * default to 'AVAILABLE', matching this taxonomy's general assumption that
 * an admin-managed catalog entry is available unless flagged otherwise.
 *
 * Naming-drift resolution: `categories-data.ts` named the Esther row bare
 * "Esther"; `kcs-pillars-data.ts` named it "Esther (with additions)" (the
 * deuterocanonical form, since History includes Jubilees/Enoch as
 * apocryphal additions alongside it). Kept the more precise pillar-sourced
 * name for the same reason as the Gospels/Gospel decision above.
 *
 * Dropped: `your-scroll-acts`, `your-scroll-epi`, `your-scroll-rev` — 3
 * inert placeholder rows from `categories-data.ts` with zero other
 * references anywhere in the repo and no corresponding entry in
 * `kcsPillars[...].scrolls`; confirmed dead seed rows, not real scrolls.
 */
const scrollSeeds: { slug: string; name: { en: string; fr: string; rw: string }; parentId: string; status?: CategoryStatus }[] = [
  { slug: 'genesis', name: { en: 'Genesis', fr: 'Genèse', rw: 'Itangiriro' }, parentId: 'kcs-fnd' },
  { slug: 'exodus', name: { en: 'Exodus', fr: 'Exode', rw: 'Kuva' }, parentId: 'kcs-fnd' },
  { slug: 'leviticus', name: { en: 'Leviticus', fr: 'Lévitique', rw: 'Abalewi' }, parentId: 'kcs-fnd' },
  { slug: 'numbers', name: { en: 'Numbers', fr: 'Nombres', rw: 'Imibare' }, parentId: 'kcs-fnd' },
  { slug: 'deuteronomy', name: { en: 'Deuteronomy', fr: 'Deutéronome', rw: 'Gutegeka kwa Kabiri' }, parentId: 'kcs-fnd' },
  { slug: 'joshua', name: { en: 'Joshua', fr: 'Josué', rw: 'Yosuwa' }, parentId: 'kcs-his' },
  { slug: 'judges', name: { en: 'Judges', fr: 'Juges', rw: 'Abacamanza' }, parentId: 'kcs-his' },
  { slug: 'ruth', name: { en: 'Ruth', fr: 'Ruth', rw: 'Rusi' }, parentId: 'kcs-his' },
  { slug: '1-samuel', name: { en: '1 Samuel', fr: '1 Samuel', rw: '1 Samweli' }, parentId: 'kcs-his' },
  { slug: '2-samuel', name: { en: '2 Samuel', fr: '2 Samuel', rw: '2 Samweli' }, parentId: 'kcs-his' },
  { slug: '1-kings', name: { en: '1 Kings', fr: '1 Rois', rw: '1 Abami' }, parentId: 'kcs-his' },
  { slug: '2-kings', name: { en: '2 Kings', fr: '2 Rois', rw: '2 Abami' }, parentId: 'kcs-his' },
  { slug: '1-chronicles', name: { en: '1 Chronicles', fr: '1 Chroniques', rw: '1 Ngoma' }, parentId: 'kcs-his' },
  { slug: '2-chronicles', name: { en: '2 Chronicles', fr: '2 Chroniques', rw: '2 Ngoma' }, parentId: 'kcs-his' },
  { slug: 'ezra', name: { en: 'Ezra', fr: 'Esdras', rw: 'Ezira' }, parentId: 'kcs-his' },
  { slug: 'nehemiah', name: { en: 'Nehemiah', fr: 'Néhémie', rw: 'Nehemiya' }, parentId: 'kcs-his' },
  { slug: 'esther', name: { en: 'Esther (with additions)', fr: 'Esther', rw: 'Esiteri' }, parentId: 'kcs-his' },
  { slug: 'job', name: { en: 'Job', fr: 'Job', rw: 'Yobu' }, parentId: 'kcs-his' },
  { slug: 'jubilees', name: { en: 'Jubilees', fr: 'Jubilés', rw: 'Yubile' }, parentId: 'kcs-his', status: 'ARCHIVED' },
  { slug: 'enoch', name: { en: 'Enoch (1 Enoch)', fr: 'Hénoch (1 Hénoch)', rw: 'Enoki (1 Enoki)' }, parentId: 'kcs-his', status: 'ARCHIVED' },
  { slug: 'tobit', name: { en: 'Tobit', fr: 'Tobie', rw: 'Tobiti' }, parentId: 'kcs-his' },
  { slug: 'judith', name: { en: 'Judith', fr: 'Judith', rw: 'Yuditi' }, parentId: 'kcs-his' },
  { slug: '1-maccabees', name: { en: '1 Maccabees', fr: '1 Maccabées', rw: '1 Makabayi' }, parentId: 'kcs-his' },
  { slug: '2-maccabees', name: { en: '2 Maccabees', fr: '2 Maccabées', rw: '2 Makabayi' }, parentId: 'kcs-his' },
  { slug: 'psalms', name: { en: 'Psalms (includes Psalm 151)', fr: 'Psaumes', rw: 'Zaburi' }, parentId: 'kcs-wis' },
  { slug: 'proverbs', name: { en: 'Proverbs', fr: 'Proverbes', rw: 'Imigani' }, parentId: 'kcs-wis' },
  { slug: 'ecclesiastes', name: { en: 'Ecclesiastes', fr: 'Ecclésiaste', rw: 'Umubwiriza' }, parentId: 'kcs-wis' },
  { slug: 'song-of-songs', name: { en: 'Song of Songs', fr: 'Cantique des Cantiques', rw: 'Indirimbo y\'Indirimbo' }, parentId: 'kcs-wis' },
  { slug: 'wisdom-of-solomon', name: { en: 'Wisdom of Solomon', fr: 'Sagesse de Salomon', rw: 'Ubwenge bwa Salomo' }, parentId: 'kcs-wis', status: 'ARCHIVED' },
  { slug: 'sirach', name: { en: 'Sirach (Ecclesiasticus)', fr: 'Siracide (Ecclésiastique)', rw: 'Siraki' }, parentId: 'kcs-wis', status: 'ARCHIVED' },
  { slug: 'isaiah', name: { en: 'Isaiah', fr: 'Isaïe', rw: 'Yesaya' }, parentId: 'kcs-prp' },
  { slug: 'jeremiah', name: { en: 'Jeremiah', fr: 'Jérémie', rw: 'Yeremiya' }, parentId: 'kcs-prp' },
  { slug: 'lamentations', name: { en: 'Lamentations', fr: 'Lamentations', rw: 'Kubirira' }, parentId: 'kcs-prp' },
  { slug: 'baruch', name: { en: 'Baruch', fr: 'Baruch', rw: 'Baruki' }, parentId: 'kcs-prp' },
  { slug: 'ezekiel', name: { en: 'Ezekiel', fr: 'Ézéchiel', rw: 'Ezekiyeli' }, parentId: 'kcs-prp' },
  { slug: 'daniel', name: { en: 'Daniel', fr: 'Daniel', rw: 'Daniyeli' }, parentId: 'kcs-prp' },
  { slug: 'hosea', name: { en: 'Hosea', fr: 'Osée', rw: 'Hoseya' }, parentId: 'kcs-prp' },
  { slug: 'joel', name: { en: 'Joel', fr: 'Joël', rw: 'Yoweli' }, parentId: 'kcs-prp' },
  { slug: 'amos', name: { en: 'Amos', fr: 'Amos', rw: 'Amosi' }, parentId: 'kcs-prp' },
  { slug: 'obadiah', name: { en: 'Obadiah', fr: 'Abdias', rw: 'Obadiya' }, parentId: 'kcs-prp' },
  { slug: 'jonah', name: { en: 'Jonah', fr: 'Jonas', rw: 'Yona' }, parentId: 'kcs-prp' },
  { slug: 'micah', name: { en: 'Micah', fr: 'Michée', rw: 'Mika' }, parentId: 'kcs-prp' },
  { slug: 'nahum', name: { en: 'Nahum', fr: 'Nahum', rw: 'Nahumu' }, parentId: 'kcs-prp' },
  { slug: 'habakkuk', name: { en: 'Habakkuk', fr: 'Habacuc', rw: 'Habakuki' }, parentId: 'kcs-prp' },
  { slug: 'zephaniah', name: { en: 'Zephaniah', fr: 'Sophonie', rw: 'Zefaniya' }, parentId: 'kcs-prp' },
  { slug: 'haggai', name: { en: 'Haggai', fr: 'Aggée', rw: 'Hagayi' }, parentId: 'kcs-prp' },
  { slug: 'zechariah', name: { en: 'Zechariah', fr: 'Zacharie', rw: 'Zekariya' }, parentId: 'kcs-prp' },
  { slug: 'malachi', name: { en: 'Malachi', fr: 'Malachie', rw: 'Malaki' }, parentId: 'kcs-prp' },
  { slug: 'matthew', name: { en: 'Matthew', fr: 'Matthieu', rw: 'Matayo' }, parentId: 'kcs-gos' },
  { slug: 'mark', name: { en: 'Mark', fr: 'Marc', rw: 'Mariko' }, parentId: 'kcs-gos' },
  { slug: 'luke', name: { en: 'Luke', fr: 'Luc', rw: 'Luka' }, parentId: 'kcs-gos' },
  { slug: 'john', name: { en: 'John', fr: 'Jean', rw: 'Yohana' }, parentId: 'kcs-gos' },
  { slug: 'acts', name: { en: 'Acts of the Apostles', fr: 'Actes des Apôtres', rw: 'Ibyakozwe n\'Intumwa' }, parentId: 'kcs-act' },
  { slug: 'romans', name: { en: 'Romans', fr: 'Romains', rw: 'Abaroma' }, parentId: 'kcs-epi' },
  { slug: '1-corinthians', name: { en: '1 Corinthians', fr: '1 Corinthiens', rw: '1 Abakorinto' }, parentId: 'kcs-epi' },
  { slug: '2-corinthians', name: { en: '2 Corinthians', fr: '2 Corinthiens', rw: '2 Abakorinto' }, parentId: 'kcs-epi' },
  { slug: 'galatians', name: { en: 'Galatians', fr: 'Galates', rw: 'Abagalatia' }, parentId: 'kcs-epi' },
  { slug: 'ephesians', name: { en: 'Ephesians', fr: 'Éphésiens', rw: 'Abefeso' }, parentId: 'kcs-epi' },
  { slug: 'philippians', name: { en: 'Philippians', fr: 'Philippiens', rw: 'Abafilipi' }, parentId: 'kcs-epi' },
  { slug: 'colossians', name: { en: 'Colossians', fr: 'Colossiens', rw: 'Abakolosayi' }, parentId: 'kcs-epi' },
  { slug: '1-thessalonians', name: { en: '1 Thessalonians', fr: '1 Thessaloniciens', rw: '1 Abatesalonike' }, parentId: 'kcs-epi' },
  { slug: '2-thessalonians', name: { en: '2 Thessalonians', fr: '2 Thessaloniciens', rw: '2 Abatesalonike' }, parentId: 'kcs-epi' },
  { slug: '1-timothy', name: { en: '1 Timothy', fr: '1 Timothée', rw: '1 Timoteyo' }, parentId: 'kcs-epi' },
  { slug: '2-timothy', name: { en: '2 Timothy', fr: '2 Timothée', rw: '2 Timoteyo' }, parentId: 'kcs-epi' },
  { slug: 'titus', name: { en: 'Titus', fr: 'Tite', rw: 'Tito' }, parentId: 'kcs-epi' },
  { slug: 'philemon', name: { en: 'Philemon', fr: 'Philémon', rw: 'Filemoni' }, parentId: 'kcs-epi' },
  { slug: 'hebrews', name: { en: 'Hebrews', fr: 'Hébreux', rw: 'Abaheburayo' }, parentId: 'kcs-epi' },
  { slug: 'james', name: { en: 'James', fr: 'Jacques', rw: 'Yakobo' }, parentId: 'kcs-epi' },
  { slug: '1-peter', name: { en: '1 Peter', fr: '1 Pierre', rw: '1 Petero' }, parentId: 'kcs-epi' },
  { slug: '2-peter', name: { en: '2 Peter', fr: '2 Pierre', rw: '2 Petero' }, parentId: 'kcs-epi' },
  { slug: '1-john', name: { en: '1 John', fr: '1 Jean', rw: '1 Yohana' }, parentId: 'kcs-epi' },
  { slug: '2-john', name: { en: '2 John', fr: '2 Jean', rw: '2 Yohana' }, parentId: 'kcs-epi' },
  { slug: '3-john', name: { en: '3 John', fr: '3 Jean', rw: '3 Yohana' }, parentId: 'kcs-epi' },
  { slug: 'jude', name: { en: 'Jude', fr: 'Jude', rw: 'Yuda' }, parentId: 'kcs-epi' },
  { slug: 'revelation', name: { en: 'Revelation', fr: 'Apocalypse', rw: 'Ibyahishuwe' }, parentId: 'kcs-rev' },
]

export const kcsScrolls: Category[] = scrollSeeds.map((s) => ({
  id: s.slug,
  slug: s.slug,
  name: s.name,
  parentId: s.parentId,
  status: s.status ?? 'AVAILABLE',
  createdAt: '2024-01-01',
}))
