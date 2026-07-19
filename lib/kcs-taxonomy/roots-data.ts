import type { Category } from './types'

/**
 * The 8 KCS root pillars. Rich content fields (`code`, `subtitle`, `range`,
 * `theme`, `description`, `detail`, `heroImage`) are sourced verbatim from
 * `kcs-pillars-data.ts`, itself sourced verbatim from KCS_LIBRARY.md — kept
 * as the authoritative source for pillar names/content since it explicitly
 * documents that provenance. `slug` and multilingual `name.fr`/`name.rw`
 * come from `categories-data.ts`, the only one of the 3 prior copies that
 * had them.
 *
 * Naming-drift resolution: `categories-data.ts` named this pillar "Gospel"
 * (singular); `kcs-pillars-data.ts` named it "Gospels" (plural). Kept
 * "Gospels" — the plural is the more precise/theological form (there are
 * four Gospel accounts) and `kcs-pillars-data.ts` is the authoritative
 * content source per the reasoning above.
 */
export const kcsRoots: Category[] = [
  {
    id: 'kcs-fnd', slug: 'kcs-fnd',
    name: { en: 'Foundation', fr: 'Fondation (KCS-FND)', rw: 'Ishingiro (KCS-FND)' },
    parentId: null, code: 'KCS-FND', subtitle: 'Constitution of the Kingdom',
    range: 'Genesis – Deuteronomy', theme: 'Origins and Covenant',
    description: "Lays the foundation of God's Kingdom, creation, covenant, and divine law.",
    detail: "This section establishes the origin of all things. It defines creation, identity of man, authority and dominion, laws of the kingdom, and covenant relationship between the King and His people. This is the constitutional root. Every principle in the Kingdom must be traced back to this foundation.",
    heroImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-his', slug: 'kcs-his',
    name: { en: 'History', fr: 'Histoire (KCS-HIS)', rw: 'Amateka (KCS-HIS)' },
    parentId: null, code: 'KCS-HIS', subtitle: 'Records of the Kingdom',
    range: 'Joshua – Esther', theme: 'Leadership and Restoration',
    description: "Chronicles the history of God's people, their victories, failures, and restoration.",
    detail: "This section records the practical outworking of Kingdom principles in real life. It reveals leadership patterns, national and personal decisions, consequences of obedience and disobedience, and cycles of corruption (kubora) and restoration. History is not just information, it is evidence.",
    heroImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-wis', slug: 'kcs-wis',
    name: { en: 'Wisdom', fr: 'Sagesse (KCS-WIS)', rw: 'Ubwenge (KCS-WIS)' },
    parentId: null, code: 'KCS-WIS', subtitle: 'Knowledge of the Kingdom',
    range: 'Job – Song of Songs', theme: 'Life and Principles',
    description: 'Provides wisdom, worship, practical living, and the fear of the Lord.',
    detail: "This section focuses on the internal life of man and the principles that govern it. It addresses the mind, heart, and soul, relationships and emotions, health, discipline, and prosperity, and the practical application of truth in daily life. This is the operational knowledge of the Kingdom.",
    heroImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-prp', slug: 'kcs-prp',
    name: { en: 'Prophetic', fr: 'Prophétique (KCS-PRP)', rw: 'Ubuhanuzi (KCS-PRP)' },
    parentId: null, code: 'KCS-PRP', subtitle: 'Voice of the Kingdom',
    range: 'Isaiah – Malachi', theme: 'Warnings and Hope',
    description: "Declares God's message through the prophets, calling people to repentance and revealing future hope.",
    detail: "This section serves as the voice of correction and direction. It reveals exposure of corruption, calls to repentance, warnings of judgment, and promises of restoration and future hope. The prophetic system ensures that the Kingdom remains aligned with truth.",
    heroImage: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-gos', slug: 'kcs-gos',
    name: { en: 'Gospels', fr: 'Évangile (KCS-GOS)', rw: 'Ivanjili (KCS-GOS)' },
    parentId: null, code: 'KCS-GOS', subtitle: 'Manifestation of the King',
    range: 'Matthew – John', theme: 'Life of Christ',
    description: "Reveals Jesus Christ as the King and the fulfillment of God's Kingdom.",
    detail: "This section reveals the King Himself. It demonstrates the nature and character of the King, the perfect model of Kingdom living, authority over sickness, sin, and systems, and the visible expression of invisible truth. Everything in the Kingdom is measured against this standard.",
    heroImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-act', slug: 'kcs-act',
    name: { en: 'Acts', fr: 'Actes (KCS-ACT)', rw: 'Ibyakozwe (KCS-ACT)' },
    parentId: null, code: 'KCS-ACT', subtitle: 'Expansion of the Kingdom',
    range: 'Acts of the Apostles', theme: 'Early Church',
    description: 'Describes the growth of the Church through the power of the Holy Spirit.',
    detail: "This section records the birth and spread of the Kingdom community. It shows how the message expands, how power operates through people, and how communities are formed and transformed. This is the prototype of Kingdom movement.",
    heroImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-epi', slug: 'kcs-epi',
    name: { en: 'Epistles', fr: 'Épîtres (KCS-EPI)', rw: 'Intumwa (KCS-EPI)' },
    parentId: null, code: 'KCS-EPI', subtitle: 'Constitution Explained',
    range: 'Romans – Jude', theme: 'Kingdom Living',
    description: 'Explains Christian doctrine, spiritual growth, leadership, and Kingdom living.',
    detail: "This section provides clarity, interpretation, and application. It explains identity of Kingdom citizens, responsibilities and conduct, structure of the community (church as a colony of the Kingdom), and practical application of Kingdom laws. This is where understanding is deepened and confusion is removed.",
    heroImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
  {
    id: 'kcs-rev', slug: 'kcs-rev',
    name: { en: 'Revelation', fr: 'Révélation (KCS-REV)', rw: 'Ibyahishuwe (KCS-REV)' },
    parentId: null, code: 'KCS-REV', subtitle: 'Consummation of the Kingdom',
    range: 'Revelation', theme: 'Final Victory and Eternal Kingdom',
    description: "Reveals the ultimate victory of Christ and the establishment of God's eternal Kingdom.",
    detail: "This section reveals the final outcome of all things. It includes the throne and courts of heaven, judgment and accountability, spiritual realities beyond the physical world, and the establishment of the eternal Kingdom. This is the conclusion that defines all beginnings.",
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop',
    createdAt: '2024-01-01',
  },
]
