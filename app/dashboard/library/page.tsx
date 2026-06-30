'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, Pencil, Archive, PlusCircle, BookOpen, Hash, Globe, Layers, Calendar, Copy } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Resource {
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

const statusConfig: Record<Resource['status'], { label: string; cls: string }> = {
  available:    { label: 'Available',    cls: 'bg-green-50 text-green-800 border-green-200' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-50   text-red-800   border-red-200'   },
  archived:     { label: 'Archived',     cls: 'bg-w-100    text-w-600     border-w-300'      },
}

// ── Mock data – KCS-organized scrolls ──────────────────────────────────────────
// Each resource is a scroll (Bible book) categorized under its KCS section

const mockResources: Resource[] = [
  // ── Foundation (KCS-FND) ──
  { id: '1', title: 'Genesis', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 50, isbn: 'KCS-FND-001', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-A.jpg', description: 'The book of beginnings — creation, the fall, the flood, and the covenant with Abraham, Isaac, and Jacob. Establishes the foundation of the Kingdom and the origin of all things.', tags: ['foundation', 'creation', 'covenant', 'genesis'] },
  { id: '2', title: 'Exodus', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 40, isbn: 'KCS-FND-002', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-B.jpg', description: 'The deliverance of Israel from Egypt, the giving of the Law at Sinai, and the establishment of the Tabernacle — the pattern of worship and governance.', tags: ['foundation', 'deliverance', 'law', 'tabernacle'] },
  { id: '3', title: 'Leviticus', author: 'Moses', publisher: 'Holy Spirit', category: 'Foundation (KCS-FND)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1445, pages: 27, isbn: 'KCS-FND-003', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-C.jpg', description: 'The manual of holiness — laws of sacrifice, priesthood, and purity. Teaches how a holy people approach a holy King.', tags: ['foundation', 'holiness', 'sacrifice', 'priesthood'] },
  // ── History (KCS-HIS) ──
  { id: '4', title: 'Joshua', author: 'Joshua', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1400, pages: 24, isbn: 'KCS-HIS-001', price: 0, totalQty: 999, availableQty: 5, status: 'available', coverImage: '/images/book-A.jpg', description: 'The conquest of Canaan — leadership under divine authority, the battle of Jericho, and the division of the promised land among the tribes.', tags: ['history', 'conquest', 'leadership', 'promised-land'] },
  { id: '5', title: 'Judges', author: 'Samuel', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1050, pages: 21, isbn: 'KCS-HIS-002', price: 0, totalQty: 999, availableQty: 0, status: 'out_of_stock', coverImage: '/images/book-B.jpg', description: 'The cycle of corruption and restoration — Israel\'s repeated departure from the Kingdom pattern and the judges raised to deliver them.', tags: ['history', 'cycles', 'judges', 'restoration'] },
  { id: '6', title: '1 Samuel', author: 'Samuel', publisher: 'Holy Spirit', category: 'History (KCS-HIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -930, pages: 31, isbn: 'KCS-HIS-003', price: 0, totalQty: 999, availableQty: 3, status: 'available', coverImage: '/images/book-C.jpg', description: 'The transition from judges to monarchy — the rise and fall of Saul, and the anointing of David as king after God\'s own heart.', tags: ['history', 'kingship', 'david', 'saul'] },
  // ── Wisdom (KCS-WIS) ──
  { id: '7', title: 'Psalms', author: 'David & Others', publisher: 'Holy Spirit', category: 'Wisdom (KCS-WIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -1000, pages: 150, isbn: 'KCS-WIS-001', price: 0, totalQty: 999, availableQty: 999, status: 'available', coverImage: '/images/book-A.jpg', description: 'The hymnbook of the Kingdom — songs of praise, lament, thanksgiving, and prophetic declarations that shape the inner life of the citizen.', tags: ['wisdom', 'worship', 'praise', 'psalms'] },
  { id: '8', title: 'Proverbs', author: 'Solomon', publisher: 'Holy Spirit', category: 'Wisdom (KCS-WIS)', type: 'Scroll', format: 'Physical', language: 'HE', year: -950, pages: 31, isbn: 'KCS-WIS-002', price: 0, totalQty: 999, availableQty: 7, status: 'available', coverImage: '/images/book-B.jpg', description: 'The principles of practical wisdom — instruction on family, work, speech, discipline, and the fear of the Lord as the beginning of knowledge.', tags: ['wisdom', 'proverbs', 'practical', 'discipline'] },
  // ── Prophetic (KCS-PRP) ──
  { id: '9', title: 'Isaiah', author: 'Isaiah', publisher: 'Holy Spirit', category: 'Prophetic (KCS-PRP)', type: 'Scroll', format: 'Physical', language: 'HE', year: -700, pages: 66, isbn: 'KCS-PRP-001', price: 0, totalQty: 999, availableQty: 4, status: 'available', coverImage: '/images/book-C.jpg', description: 'The vision of the prophet — judgment and comfort, the call to repentance, and the promise of the coming King and His eternal Kingdom.', tags: ['prophetic', 'judgment', 'comfort', 'messiah'] },
  { id: '10', title: 'Daniel', author: 'Daniel', publisher: 'Holy Spirit', category: 'Prophetic (KCS-PRP)', type: 'Scroll', format: 'Physical', language: 'HE', year: -535, pages: 12, isbn: 'KCS-PRP-002', price: 0, totalQty: 999, availableQty: 2, status: 'available', coverImage: '/images/book-A.jpg', description: 'The sovereignty of God over earthly kingdoms — visions of future empires, the son of man, and the final establishment of the Kingdom.', tags: ['prophetic', 'visions', 'kingdoms', 'sovereignty'] },
  // ── Gospel (KCS-GOS) ──
  { id: '11', title: 'Matthew', author: 'Matthew', publisher: 'Holy Spirit', category: 'Gospel (KCS-GOS)', type: 'Scroll', format: 'Physical', language: 'GR', year: 50, pages: 28, isbn: 'KCS-GOS-001', price: 0, totalQty: 999, availableQty: 8, status: 'available', coverImage: '/images/book-B.jpg', description: 'The Gospel of the King — Matthew presents Jesus as the promised King, the fulfillment of prophecy, and the embodiment of the Kingdom on earth.', tags: ['gospel', 'king', 'fulfillment', 'jesus'] },
  { id: '12', title: 'John', author: 'John', publisher: 'Holy Spirit', category: 'Gospel (KCS-GOS)', type: 'Scroll', format: 'Physical', language: 'GR', year: 90, pages: 21, isbn: 'KCS-GOS-002', price: 0, totalQty: 999, availableQty: 6, status: 'available', coverImage: '/images/book-C.jpg', description: 'The Gospel of the Son — the deepest revelation of the nature and character of the King, His authority over all things, and the path to eternal life.', tags: ['gospel', 'son-of-god', 'eternal-life', 'revelation'] },
  // ── Acts (KCS-ACT) ──
  { id: '13', title: 'Acts of the Apostles', author: 'Luke', publisher: 'Holy Spirit', category: 'Acts (KCS-ACT)', type: 'Scroll', format: 'Physical', language: 'GR', year: 63, pages: 28, isbn: 'KCS-ACT-001', price: 0, totalQty: 999, availableQty: 10, status: 'available', coverImage: '/images/book-A.jpg', description: 'The birth and expansion of the Kingdom community — the outpouring of the Spirit, the apostolic missions, and the blueprint for Kingdom movement.', tags: ['acts', 'holy-spirit', 'mission', 'expansion'] },
  // ── Epistles (KCS-EPI) ──
  { id: '14', title: 'Romans', author: 'Paul', publisher: 'Holy Spirit', category: 'Epistles (KCS-EPI)', type: 'Scroll', format: 'Physical', language: 'GR', year: 57, pages: 16, isbn: 'KCS-EPI-001', price: 0, totalQty: 999, availableQty: 9, status: 'available', coverImage: '/images/book-B.jpg', description: 'The constitution of the Kingdom explained — righteousness by faith, the role of the law, and the practical outworking of salvation in daily life.', tags: ['epistles', 'faith', 'righteousness', 'paul'] },
  { id: '15', title: 'Ephesians', author: 'Paul', publisher: 'Holy Spirit', category: 'Epistles (KCS-EPI)', type: 'Scroll', format: 'Physical', language: 'GR', year: 60, pages: 6, isbn: 'KCS-EPI-002', price: 0, totalQty: 999, availableQty: 0, status: 'out_of_stock', coverImage: '/images/book-C.jpg', description: 'The identity and position of the citizen in Christ — the mystery of the Kingdom, spiritual blessings, and the armour of God for spiritual governance.', tags: ['epistles', 'identity', 'spiritual-warfare', 'grace'] },
  // ── Revelation (KCS-REV) ──
  { id: '16', title: 'Revelation', author: 'John', publisher: 'Holy Spirit', category: 'Revelation (KCS-REV)', type: 'Scroll', format: 'Physical', language: 'GR', year: 95, pages: 22, isbn: 'KCS-REV-001', price: 0, totalQty: 999, availableQty: 12, status: 'available', coverImage: '/images/book-A.jpg', description: 'The unveiling of Jesus Christ — the throne of heaven, judgment, the new heaven and new earth, and the eternal Kingdom where God dwells with His people.', tags: ['revelation', 'prophecy', 'judgment', 'eternal-kingdom'] },
]

// ── Detail row helper ─────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminLibraryPage() {
  const [data,         setData]         = useState<Resource[]>(mockResources)
  const [selected,     setSelected]     = useState<Resource | null>(null)
  const [statusFilter, setStatusFilter] = useState<Resource['status'] | 'all'>('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [toast,        setToast]        = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleArchive = (r: Resource) => {
    setData((prev) => prev.map((item) => item.id === r.id ? { ...item, status: 'archived' } : item))
    setSelected(null)
    showToast(`"${r.title}" archived.`)
  }

  const tableData = data.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchType   = typeFilter   === 'all' || r.type.toLowerCase() === typeFilter
    return matchStatus && matchType
  })

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Resources',  value: data.length,                                             color: 'text-w-950'     },
    { label: 'Available',        value: data.filter((r) => r.status === 'available').length,     color: 'text-green-700' },
    { label: 'Out of Stock',     value: data.filter((r) => r.status === 'out_of_stock').length,  color: 'text-red-700'   },
    { label: 'Archived',         value: data.filter((r) => r.status === 'archived').length,      color: 'text-w-600'     },
    { label: 'Total Copies',     value: data.reduce((s, r) => s + r.totalQty, 0),               color: 'text-w-950'     },
    { label: 'Available Copies', value: data.reduce((s, r) => s + r.availableQty, 0),           color: 'text-green-700' },
  ]

  const types = ['all', ...Array.from(new Set(data.map((r) => r.type.toLowerCase())))]

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<Resource>[] = [
    {
      key: 'title', label: 'Resource', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden bg-w-200">
            <Image src={r.coverImage} alt={r.title} fill className="object-cover" />
          </div>
          <div>
            <p className="font-semibold text-w-950 max-w-[180px] truncate">{r.title}</p>
            <p className="text-xs text-w-600">{r.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category', label: 'KCS Section', sortable: true,
      render: (r) => {
        const codeMatch = r.category.match(/\(([^)]+)\)/)
        const kcsCode = codeMatch ? codeMatch[1] : ''
        return (
          <div>
            <p>{r.category.replace(/\s*\([^)]+\)/, '')}</p>
            {kcsCode && <span className="inline-block px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-mono font-semibold mt-0.5">{kcsCode}</span>}
          </div>
        )
      },
    },
    {
      key: 'language', label: 'Lang', sortable: true,
      render: (r) => <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{r.language}</span>,
    },
    {
      key: 'availableQty', label: 'Stock', sortable: true,
      render: (r) => (
        <div>
          <p className={`font-semibold ${r.availableQty === 0 ? 'text-red-700' : 'text-green-700'}`}>
            {r.availableQty} / {r.totalQty}
          </p>
          <p className="text-xs text-w-600">available / total</p>
        </div>
      ),
    },
    {
      key: 'price', label: 'Price', sortable: true,
      render: (r) => <span className="font-cinzel text-sm font-semibold text-w-600">{r.price.toLocaleString()} RWF</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}>
          {statusConfig[r.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelected(r)}
            className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
          >
            <Eye size={12} /> View
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
            <Pencil size={12} /> Edit
          </button>
          {r.status !== 'archived' && (
            <button
              onClick={() => handleArchive(r)}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"
            >
              <Archive size={12} /> Archive
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Book Inventory" subtitle="Kingdom Classification System — manage scrolls across all 8 KCS sections" />
        <ElegantButton variant="primary" className="flex items-center gap-1.5 shrink-0">
          <PlusCircle size={15} /> Add Resource
        </ElegantButton>
      </div>

      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable<Resource>
        data={tableData}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search title, author, ISBN..."
        searchFilter={(r, q) =>
          r.title.toLowerCase().includes(q)    ||
          r.author.toLowerCase().includes(q)   ||
          r.isbn.includes(q)                   ||
          r.category.toLowerCase().includes(q)
        }
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Resource['status'] | 'all')}
              className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(statusConfig) as Resource['status'][]).map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
            >
              {types.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </>
        }
        onExport={() => console.log('TODO: export CSV')}
        emptyMessage="No resources match your filters."
      />

      {/* ── Book detail modal ──────────────────────────────────────────────── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Resource Details" size="xl">
        {selected && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover */}
            <div className="shrink-0">
              <div className="relative w-40 h-56 rounded-lg overflow-hidden border border-w-300 bg-w-200">
                <Image src={selected.coverImage} alt={selected.title} fill className="object-cover" />
              </div>
              {/* Stock indicator */}
              <div className={`mt-3 text-center py-1.5 rounded text-xs font-lato font-semibold border ${statusConfig[selected.status].cls}`}>
                {selected.availableQty} / {selected.totalQty} available
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-cinzel text-lg font-semibold text-w-950 leading-snug">{selected.title}</h3>
                <p className="font-lato text-sm text-w-700 mt-0.5">by {selected.author}</p>
                <p className="font-cinzel text-base font-bold text-w-600 mt-1">{selected.price.toLocaleString()} RWF</p>
              </div>

              {/* Description */}
              <div className="bg-form-highlight border border-w-300 rounded p-3">
                <p className="font-lato text-xs text-w-700 leading-relaxed">{selected.description}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <DetailRow icon={<BookOpen size={13} />}  label="Type"      value={`${selected.type} · ${selected.format}`} />
                <DetailRow icon={<Layers size={13} />}    label="Category"  value={selected.category} />
                <DetailRow icon={<Globe size={13} />}     label="Language"  value={selected.language} />
                <DetailRow icon={<Calendar size={13} />}  label="Year"      value={String(selected.year)} />
                <DetailRow icon={<BookOpen size={13} />}  label="Pages"     value={`${selected.pages} pages`} />
                <DetailRow icon={<Hash size={13} />}      label="ISBN"      value={selected.isbn} />
                <DetailRow icon={<Copy size={13} />}      label="Publisher" value={selected.publisher} />
                <DetailRow icon={<Layers size={13} />}    label="Status"    value={statusConfig[selected.status].label} />
              </div>

              {/* Tags */}
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">#{t}</span>
                  ))}
                </div>
              )}

              {/* Modal actions */}
              <div className="flex gap-2 pt-2 border-t border-w-300">
                <ElegantButton variant="primary" className="flex items-center gap-1.5 text-xs py-2">
                  <Pencil size={13} /> Edit Resource
                </ElegantButton>
                {selected.status !== 'archived' && (
                  <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2" onClick={() => handleArchive(selected)}>
                    <Archive size={13} /> Archive
                  </ElegantButton>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
