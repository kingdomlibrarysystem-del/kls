/** Digital library resource — a "scroll" categorized under a KCS section. */
export interface Resource {
  id: string
  title: string
  author: string
  publisher: string
  category: string
  type: string
  format: string
  language: string
  year: number
  pages: number
  isbn: string
  price: number
  totalQty: number
  availableQty: number
  status: 'available' | 'out_of_stock' | 'archived'
  coverImage: string
  description: string
  tags: string[]
}

export const statusConfig: Record<Resource['status'], { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'bg-green-50 text-green-800 border-green-200' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-50   text-red-800   border-red-200' },
  archived: { label: 'Archived', cls: 'bg-w-100    text-w-600     border-w-300' },
}

// ── Mock data – KCS-organized scrolls ──────────────────────────────────────────
export const mockResources: Resource[] = [
  { id: '1', title: 'Genesis', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 50, isbn: 'KCS-FND-001', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-A.jpg', description: 'The book of beginnings — creation, the fall, the flood, and the covenant with Abraham, Isaac, and Jacob. Establishes the foundation of the Kingdom and the origin of all things.', tags: ['foundation', 'creation', 'covenant', 'genesis'] },
  { id: '2', title: 'Exodus', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 40, isbn: 'KCS-FND-002', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-B.jpg', description: 'The deliverance of Israel from Egypt, the giving of the Law at Sinai, and the establishment of the Tabernacle — the pattern of worship and governance.', tags: ['foundation', 'deliverance', 'law', 'tabernacle'] },
  { id: '3', title: 'Leviticus', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 27, isbn: 'KCS-FND-003', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-C.jpg', description: 'The manual of holiness — laws of sacrifice, priesthood, and purity. Teaches how a holy people approach a holy King.', tags: ['foundation', 'holiness', 'sacrifice', 'priesthood'] },
  { id: '4', title: 'Joshua', author: 'Joshua', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1400, pages: 24, isbn: 'KCS-HIS-001', price: 0, totalQty: 999, availableQty: 5, status: 'available', coverImage: '/images/book-A.jpg', description: 'The conquest of Canaan — leadership under divine authority, the battle of Jericho, and the division of the promised land among the tribes.', tags: ['history', 'conquest', 'leadership', 'promised-land'] },
  { id: '5', title: 'Judges', author: 'Samuel', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1050, pages: 21, isbn: 'KCS-HIS-002', price: 0, totalQty: 999, availableQty: 0, status: 'out_of_stock', coverImage: '/images/book-B.jpg', description: 'The cycle of corruption and restoration — Israel\'s repeated departure from the Kingdom pattern and the judges raised to deliver them.', tags: ['history', 'cycles', 'judges', 'restoration'] },
  { id: '6', title: '1 Samuel', author: 'Samuel', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -930, pages: 31, isbn: 'KCS-HIS-003', price: 0, totalQty: 999, availableQty: 3, status: 'available', coverImage: '/images/book-C.jpg', description: 'The transition from judges to monarchy — the rise and fall of Saul, and the anointing of David as king after God\'s own heart.', tags: ['history', 'kingship', 'david', 'saul'] },
  { id: '7', title: 'Psalms', author: 'David & Others', publisher: 'Holy Spirit', category: 'Wisdom (KCS-WIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1000, pages: 150, isbn: 'KCS-WIS-001', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-A.jpg', description: 'The hymnbook of the Kingdom — songs of praise, lament, thanksgiving, and prophetic declarations that shape the inner life of the citizen.', tags: ['wisdom', 'worship', 'praise', 'psalms'] },
  { id: '8', title: 'Proverbs', author: 'Solomon', publisher: 'Holy Spirit', category: 'Wisdom (KCS-WIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -950, pages: 31, isbn: 'KCS-WIS-002', price: 0, totalQty: 999, availableQty: 7, status: 'available', coverImage: '/images/book-B.jpg', description: 'The principles of practical wisdom — instruction on family, work, speech, discipline, and the fear of the Lord as the beginning of knowledge.', tags: ['wisdom', 'proverbs', 'practical', 'discipline'] },
  { id: '9', title: 'Isaiah', author: 'Isaiah', publisher: 'Holy Spirit', category: 'Prophetic (KCS-PRP)', type: 'Scroll', format: 'Physical', language: 'HE', year: -700, pages: 66, isbn: 'KCS-PRP-001', price: 0, totalQty: 999, availableQty: 4, status: 'available', coverImage: '/images/book-C.jpg', description: 'The vision of the prophet — judgment and comfort, the call to repentance, and the promise of the coming King and His eternal Kingdom.', tags: ['prophetic', 'judgment', 'comfort', 'messiah'] },
  { id: '10', title: 'Daniel', author: 'Daniel', publisher: 'Holy Spirit', category: 'Prophetic (KCS-PRP)', type: 'Scroll', format: 'Physical', language: 'HE', year: -535, pages: 12, isbn: 'KCS-PRP-002', price: 0, totalQty: 999, availableQty: 2, status: 'available', coverImage: '/images/book-A.jpg', description: 'The sovereignty of God over earthly kingdoms — visions of future empires, the son of man, and the final establishment of the Kingdom.', tags: ['prophetic', 'visions', 'kingdoms', 'sovereignty'] },
  { id: '11', title: 'Matthew', author: 'Matthew', publisher: 'Holy Spirit', category: 'Gospel (KCS-GOS)', type: 'Scroll', format: 'Physical', language: 'GR', year: 50, pages: 28, isbn: 'KCS-GOS-001', price: 0, totalQty: 999, availableQty: 8, status: 'available', coverImage: '/images/book-B.jpg', description: 'The Gospel of the King — Matthew presents Jesus as the promised King, the fulfillment of prophecy, and the embodiment of the Kingdom on earth.', tags: ['gospel', 'king', 'fulfillment', 'jesus'] },
  { id: '12', title: 'John', author: 'John', publisher: 'Holy Spirit', category: 'Gospel (KCS-GOS)', type: 'Scroll', format: 'Physical', language: 'GR', year: 90, pages: 21, isbn: 'KCS-GOS-002', price: 0, totalQty: 999, availableQty: 6, status: 'available', coverImage: '/images/book-C.jpg', description: 'The Gospel of the Son — the deepest revelation of the nature and character of the King, His authority over all things, and the path to eternal life.', tags: ['gospel', 'son-of-god', 'eternal-life', 'revelation'] },
  { id: '13', title: 'Acts of the Apostles', author: 'Luke', publisher: 'Holy Spirit', category: 'Acts (KCS-ACT)', type: 'Scroll', format: 'Physical', language: 'GR', year: 63, pages: 28, isbn: 'KCS-ACT-001', price: 0, totalQty: 999, availableQty: 10, status: 'available', coverImage: '/images/book-A.jpg', description: 'The birth and expansion of the Kingdom community — the outpouring of the Spirit, the apostolic missions, and the blueprint for Kingdom movement.', tags: ['acts', 'holy-spirit', 'mission', 'expansion'] },
  { id: '14', title: 'Romans', author: 'Paul', publisher: 'Holy Spirit', category: 'Epistles (KCS-EPI)', type: 'Scroll', format: 'Physical', language: 'GR', year: 57, pages: 16, isbn: 'KCS-EPI-001', price: 0, totalQty: 999, availableQty: 9, status: 'available', coverImage: '/images/book-B.jpg', description: 'The constitution of the Kingdom explained — righteousness by faith, the role of the law, and the practical outworking of salvation in daily life.', tags: ['epistles', 'faith', 'righteousness', 'paul'] },
  { id: '15', title: 'Ephesians', author: 'Paul', publisher: 'Holy Spirit', category: 'Epistles (KCS-EPI)', type: 'Scroll', format: 'Physical', language: 'GR', year: 60, pages: 6, isbn: 'KCS-EPI-002', price: 0, totalQty: 999, availableQty: 0, status: 'out_of_stock', coverImage: '/images/book-C.jpg', description: 'The identity and position of the citizen in Christ — the mystery of the Kingdom, spiritual blessings, and the armour of God for spiritual governance.', tags: ['epistles', 'identity', 'spiritual-warfare', 'grace'] },
  { id: '16', title: 'Revelation', author: 'John', publisher: 'Holy Spirit', category: 'Revelation (KCS-REV)', type: 'Scroll', format: 'Physical', language: 'GR', year: 95, pages: 22, isbn: 'KCS-REV-001', price: 0, totalQty: 999, availableQty: 12, status: 'available', coverImage: '/images/book-A.jpg', description: 'The unveiling of Jesus Christ — the throne of heaven, judgment, the new heaven and new earth, and the eternal Kingdom where God dwells with His people.', tags: ['revelation', 'prophecy', 'judgment', 'eternal-kingdom'] },
]

export const categoryOptions = [
  'Foundation (KCS-FND)', 'History (KCS-HIS)', 'Wisdom (KCS-WIS)', 'Prophetic (KCS-PRP)',
  'Gospel (KCS-GOS)', 'Acts (KCS-ACT)', 'Epistles (KCS-EPI)', 'Revelation (KCS-REV)',
] as const
