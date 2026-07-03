/**
 * The 8 pillars of the Kingdom Classification System (KCS), sourced verbatim
 * from KCS_LIBRARY.md's "Core Pillars of the Kingdom Library" summary list.
 * `subtitle`, `range`, `theme`, and `description` are quoted directly from
 * that section — do not paraphrase. `detail` quotes the longer per-section
 * description further down in the same document, for additional context.
 */

export type ScrollStatus = 'AVAILABLE' | 'ARCHIVED' | 'OUT_OF_STOCK'

export interface Scroll {
  code: string
  title: string
  status: ScrollStatus
}

export interface KcsPillar {
  /** URL-safe key used as the route segment under /dashboard/kcs/. */
  key: string
  /** KCS classification code, e.g. "KCS-FND". */
  code: string
  name: string
  /** Tagline from the Core Pillars list, e.g. "Constitution of the Kingdom". */
  subtitle: string
  /** Book span covered by this pillar. */
  range: string
  /** Theme phrase from the Core Pillars list, e.g. "Origins and Covenant". */
  theme: string
  /** One-sentence description from the Core Pillars list. */
  description: string
  /** Longer description from the pillar's dedicated section further in the document. */
  detail: string
  scrolls: Scroll[]
}

export const kcsPillars: Record<string, KcsPillar> = {
  foundation: {
    key: 'foundation',
    code: 'KCS-FND',
    name: 'Foundation',
    subtitle: 'Constitution of the Kingdom',
    range: 'Genesis – Deuteronomy',
    theme: 'Origins and Covenant',
    description: "Lays the foundation of God's Kingdom, creation, covenant, and divine law.",
    detail:
      "This section establishes the origin of all things. It defines creation, identity of man, authority and dominion, laws of the kingdom, and covenant relationship between the King and His people. This is the constitutional root. Every principle in the Kingdom must be traced back to this foundation.",
    scrolls: [
      { code: 'Gen', title: 'Genesis', status: 'AVAILABLE' },
      { code: 'Exo', title: 'Exodus', status: 'AVAILABLE' },
      { code: 'Lev', title: 'Leviticus', status: 'AVAILABLE' },
      { code: 'Num', title: 'Numbers', status: 'AVAILABLE' },
      { code: 'Deut', title: 'Deuteronomy', status: 'AVAILABLE' },
    ],
  },
  history: {
    key: 'history',
    code: 'KCS-HIS',
    name: 'History',
    subtitle: 'Records of the Kingdom',
    range: 'Joshua – Esther',
    theme: 'Leadership and Restoration',
    description: "Chronicles the history of God's people, their victories, failures, and restoration.",
    detail:
      "This section records the practical outworking of Kingdom principles in real life. It reveals leadership patterns, national and personal decisions, consequences of obedience and disobedience, and cycles of corruption (kubora) and restoration. History is not just information, it is evidence.",
    scrolls: [
      { code: 'Josh', title: 'Joshua', status: 'AVAILABLE' },
      { code: 'Judg', title: 'Judges', status: 'AVAILABLE' },
      { code: 'Ruth', title: 'Ruth', status: 'AVAILABLE' },
      { code: '1 Sam.', title: '1 Samuel', status: 'AVAILABLE' },
      { code: '2 Sam', title: '2 Samuel', status: 'AVAILABLE' },
      { code: '1 Kgs', title: '1 Kings', status: 'AVAILABLE' },
      { code: '2 Kgs', title: '2 Kings', status: 'AVAILABLE' },
      { code: 'Jub', title: 'Jubilees', status: 'ARCHIVED' },
      { code: 'Enoch', title: 'Enoch (1 Enoch)', status: 'ARCHIVED' },
      { code: 'Est', title: 'Esther (with additions)', status: 'AVAILABLE' },
    ],
  },
  wisdom: {
    key: 'wisdom',
    code: 'KCS-WIS',
    name: 'Wisdom',
    subtitle: 'Knowledge of the Kingdom',
    range: 'Job – Song of Songs',
    theme: 'Life and Principles',
    description: 'Provides wisdom, worship, practical living, and the fear of the Lord.',
    detail:
      "This section focuses on the internal life of man and the principles that govern it. It addresses the mind, heart, and soul, relationships and emotions, health, discipline, and prosperity, and the practical application of truth in daily life. This is the operational knowledge of the Kingdom.",
    scrolls: [
      { code: 'Job', title: 'Job', status: 'AVAILABLE' },
      { code: 'Ps', title: 'Psalms (includes Psalm 151)', status: 'AVAILABLE' },
      { code: 'Prov', title: 'Proverbs', status: 'AVAILABLE' },
      { code: 'Eccl', title: 'Ecclesiastes', status: 'AVAILABLE' },
      { code: 'Song', title: 'Song of Songs', status: 'AVAILABLE' },
      { code: 'Wis', title: 'Wisdom of Solomon', status: 'ARCHIVED' },
      { code: 'Sir', title: 'Sirach (Ecclesiasticus)', status: 'ARCHIVED' },
    ],
  },
  prophetic: {
    key: 'prophetic',
    code: 'KCS-PRP',
    name: 'Prophetic',
    subtitle: 'Voice of the Kingdom',
    range: 'Isaiah – Malachi',
    theme: 'Warnings and Hope',
    description: "Declares God's message through the prophets, calling people to repentance and revealing future hope.",
    detail:
      "This section serves as the voice of correction and direction. It reveals exposure of corruption, calls to repentance, warnings of judgment, and promises of restoration and future hope. The prophetic system ensures that the Kingdom remains aligned with truth.",
    scrolls: [
      { code: 'Isa', title: 'Isaiah', status: 'AVAILABLE' },
      { code: 'Jer', title: 'Jeremiah', status: 'AVAILABLE' },
      { code: 'Ezek', title: 'Ezekiel', status: 'AVAILABLE' },
      { code: 'Dan', title: 'Daniel', status: 'AVAILABLE' },
      { code: 'Hos', title: 'Hosea', status: 'AVAILABLE' },
      { code: 'Joel', title: 'Joel', status: 'AVAILABLE' },
      { code: 'Amos', title: 'Amos', status: 'AVAILABLE' },
      { code: 'Zech', title: 'Zechariah', status: 'AVAILABLE' },
      { code: 'Mal', title: 'Malachi', status: 'AVAILABLE' },
    ],
  },
  gospel: {
    key: 'gospel',
    code: 'KCS-GOS',
    name: 'Gospels',
    subtitle: 'Manifestation of the King',
    range: 'Matthew – John',
    theme: 'Life of Christ',
    description: "Reveals Jesus Christ as the King and the fulfillment of God's Kingdom.",
    detail:
      "This section reveals the King Himself. It demonstrates the nature and character of the King, the perfect model of Kingdom living, authority over sickness, sin, and systems, and the visible expression of invisible truth. Everything in the Kingdom is measured against this standard.",
    scrolls: [
      { code: 'Matt', title: 'Matthew', status: 'AVAILABLE' },
      { code: 'Mark', title: 'Mark', status: 'AVAILABLE' },
      { code: 'Luke', title: 'Luke', status: 'AVAILABLE' },
      { code: 'John', title: 'John', status: 'AVAILABLE' },
    ],
  },
  acts: {
    key: 'acts',
    code: 'KCS-ACT',
    name: 'Acts',
    subtitle: 'Expansion of the Kingdom',
    range: 'Acts of the Apostles',
    theme: 'Early Church',
    description: 'Describes the growth of the Church through the power of the Holy Spirit.',
    detail:
      "This section records the birth and spread of the Kingdom community. It shows how the message expands, how power operates through people, and how communities are formed and transformed. This is the prototype of Kingdom movement.",
    scrolls: [
      { code: 'Act', title: 'Acts of the Apostles', status: 'AVAILABLE' },
    ],
  },
  epistles: {
    key: 'epistles',
    code: 'KCS-EPI',
    name: 'Epistles',
    subtitle: 'Constitution Explained',
    range: 'Romans – Jude',
    theme: 'Kingdom Living',
    description: 'Explains Christian doctrine, spiritual growth, leadership, and Kingdom living.',
    detail:
      "This section provides clarity, interpretation, and application. It explains identity of Kingdom citizens, responsibilities and conduct, structure of the community (church as a colony of the Kingdom), and practical application of Kingdom laws. This is where understanding is deepened and confusion is removed.",
    scrolls: [
      { code: 'Ram', title: 'Romans', status: 'AVAILABLE' },
      { code: '1 Cor', title: '1 Corinthians', status: 'AVAILABLE' },
      { code: '2 Cor', title: '2 Corinthians', status: 'AVAILABLE' },
      { code: 'Gal', title: 'Galatians', status: 'AVAILABLE' },
      { code: 'Eph', title: 'Ephesians', status: 'AVAILABLE' },
      { code: 'Heb', title: 'Hebrews', status: 'AVAILABLE' },
      { code: 'James', title: 'James', status: 'AVAILABLE' },
      { code: '1 Pet', title: '1 Peter', status: 'AVAILABLE' },
      { code: 'Jude', title: 'Jude', status: 'AVAILABLE' },
    ],
  },
  revelation: {
    key: 'revelation',
    code: 'KCS-REV',
    name: 'Revelation',
    subtitle: 'Consummation of the Kingdom',
    range: 'Revelation',
    theme: 'Final Victory and Eternal Kingdom',
    description: "Reveals the ultimate victory of Christ and the establishment of God's eternal Kingdom.",
    detail:
      "This section reveals the final outcome of all things. It includes the throne and courts of heaven, judgment and accountability, spiritual realities beyond the physical world, and the establishment of the eternal Kingdom. This is the conclusion that defines all beginnings.",
    scrolls: [
      { code: 'Rev', title: 'Revelation', status: 'AVAILABLE' },
    ],
  },
}
