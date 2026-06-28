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

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockResources: Resource[] = [
  { id: '1', title: 'The Pursuit of Knowledge', author: 'Dr. James Mitchell', publisher: 'Oxford Press', category: 'Philosophy', type: 'Book', format: 'Physical', language: 'EN', year: 2021, pages: 312, isbn: '978-1234567890', price: 4500, totalQty: 5, availableQty: 3, status: 'available', coverImage: '/images/book-A.jpg', description: 'A deep dive into philosophical inquiry, examining how humanity has chased understanding across centuries — from Socrates to modern thinkers. Provides a comprehensive framework for critical thinking, epistemology, and the foundations of knowledge acquisition.', tags: ['philosophy', 'critical-thinking', 'epistemology'] },
  { id: '2', title: 'Digital Transformation', author: 'Sarah Johnson', publisher: 'TechBooks Africa', category: 'Technology', type: 'E-Book', format: 'Digital', language: 'EN', year: 2022, pages: 256, isbn: '978-0987654321', price: 6000, totalQty: 10, availableQty: 5, status: 'available', coverImage: '/images/book-B.jpg', description: 'How digital technologies are reshaping industries, governance, and daily life — with case studies from Africa and beyond.', tags: ['technology', 'digital', 'africa'] },
  { id: '3', title: 'Ancient Civilizations', author: 'Prof. Robert Anderson', publisher: 'Kigali Academic', category: 'History', type: 'Book', format: 'Physical', language: 'EN', year: 2019, pages: 480, isbn: '978-1122334455', price: 5500, totalQty: 4, availableQty: 0, status: 'out_of_stock', coverImage: '/images/book-C.jpg', description: 'A sweeping journey through the rise and fall of ancient empires — Egypt, Rome, Mesopotamia — and the lessons they leave for today.', tags: ['history', 'civilizations', 'ancient'] },
  { id: '4', title: 'Modern Art & Culture', author: 'Elena Rodriguez', publisher: 'Artworld Press', category: 'Arts', type: 'Journal', format: 'Digital', language: 'FR', year: 2023, pages: 198, isbn: '978-5566778899', price: 3800, totalQty: 7, availableQty: 7, status: 'available', coverImage: '/images/book-A.jpg', description: 'Survey of 20th and 21st century art movements — from Abstract Expressionism to digital and street culture.', tags: ['art', 'culture', 'modern'] },
  { id: '5', title: 'Inzira y\'Ubumenyi', author: 'Dr. Kamanzi Pierre', publisher: 'Kigali Publishers', category: 'Philosophy', type: 'Book', format: 'Physical', language: 'RW', year: 2020, pages: 200, isbn: '978-2233445566', price: 3000, totalQty: 3, availableQty: 0, status: 'archived', coverImage: '/images/book-B.jpg', description: 'Ubumenyi n\'inzira yo kubwigira — igitabo gisesengura imiterere y\'ubwenge n\'indangagaciro.', tags: ['kinyarwanda', 'philosophy'] },
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
      key: 'category', label: 'Category', sortable: true,
      render: (r) => (
        <div>
          <p>{r.category}</p>
          <p className="text-xs text-w-600">{r.type} · {r.format}</p>
        </div>
      ),
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
        <PageHeader title="Library Management" subtitle="Manage all resources — books, e-books, journals, audio and video" />
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
