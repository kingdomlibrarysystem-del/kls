'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CalendarClock, Globe, Hash, Layers } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { BorrowModal } from '../_components/borrow-modal'
import type { Resource } from '../_components/resource-card'

// Mock — replace with API fetch by id
const mockResources: Resource[] = [
  { id: '1', title: 'The Pursuit of Knowledge', author: 'Dr. James Mitchell', category: 'Philosophy', type: 'book', format: 'physical', language: 'en', year: 2021, pages: 312, isbn: '978-1234567890', price: 4500, available: 3, total: 5, coverImage: '/images/book-A.jpg', description: 'A deep dive into philosophical inquiry, examining how humanity has chased understanding across centuries — from Socrates to modern thinkers. This book provides a comprehensive framework for critical thinking, epistemology, and the foundations of knowledge acquisition.' },
  { id: '2', title: 'Digital Transformation', author: 'Sarah Johnson', category: 'Technology', type: 'ebook', format: 'digital', language: 'en', year: 2022, pages: 256, isbn: '978-0987654321', price: 6000, available: 5, total: 5, coverImage: '/images/book-B.jpg', description: 'Explores how digital technologies are reshaping industries, governance, and daily life — with case studies from Africa and beyond.' },
  { id: '3', title: 'Ancient Civilizations', author: 'Prof. Robert Anderson', category: 'History', type: 'book', format: 'physical', language: 'en', year: 2019, pages: 480, isbn: '978-1122334455', price: 5500, available: 2, total: 4, coverImage: '/images/book-C.jpg', description: 'A sweeping journey through the rise and fall of ancient empires — Egypt, Rome, Mesopotamia — and the lessons they leave for today.' },
]

interface Props {
  params: { id: string }
}

export default function ResourceDetailPage({ params }: Props) {
  const resource = mockResources.find((r) => r.id === params.id) ?? mockResources[0]
  const [modal, setModal] = useState<'borrow' | 'reserve' | null>(null)
  const [toast, setToast] = useState('')

  const isAvailable = resource.available > 0

  const handleConfirm = () => {
    const msg = modal === 'borrow'
      ? `Borrow request submitted for "${resource.title}"`
      : `Added to the reservation queue for "${resource.title}"`
    setModal(null)
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 font-lato text-sm text-w-700 hover:text-w-950 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Library
      </Link>

      {/* Toast */}
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-w-300 bg-w-200">
            <Image src={resource.coverImage} alt={resource.title} fill className="object-cover" />
          </div>

          {/* Availability badge */}
          <div className={`mt-3 text-center py-2 rounded font-lato text-sm font-semibold ${
            isAvailable ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isAvailable ? `${resource.available} of ${resource.total} available` : 'Currently unavailable'}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            <ElegantButton variant="primary" fullWidth onClick={() => setModal('borrow')} disabled={!isAvailable}>
              <BookOpen size={15} className="inline mr-1.5" /> Borrow
            </ElegantButton>
            <ElegantButton variant="outline" fullWidth onClick={() => setModal('reserve')}>
              <CalendarClock size={15} className="inline mr-1.5" /> Reserve
            </ElegantButton>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <h1 className="font-cinzel text-2xl font-semibold text-w-950 mb-1" style={{ letterSpacing: '0.5px' }}>
              {resource.title}
            </h1>
            <p className="font-lato text-w-700">by {resource.author}</p>
          </div>

          <p className="font-cinzel text-xl font-bold text-w-600">{resource.price.toLocaleString('en-RW')} RWF</p>

          {/* Description */}
          <div className="bg-form-highlight border border-w-300 rounded-lg p-4">
            <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Description</h3>
            <p className="font-lato text-sm text-w-700 leading-relaxed">{resource.description}</p>
          </div>

          {/* Metadata */}
          <div className="bg-form-highlight border border-w-300 rounded-lg p-4">
            <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-y-2.5 font-lato text-sm">
              {[
                { icon: <Layers size={13} />,      label: 'Category',  value: resource.category },
                { icon: <BookOpen size={13} />,    label: 'Type',      value: resource.type.charAt(0).toUpperCase() + resource.type.slice(1) },
                { icon: <Layers size={13} />,      label: 'Format',    value: resource.format.charAt(0).toUpperCase() + resource.format.slice(1) },
                { icon: <Globe size={13} />,       label: 'Language',  value: resource.language.toUpperCase() },
                { icon: <CalendarClock size={13} />, label: 'Year',    value: String(resource.year) },
                ...(resource.pages ? [{ icon: <BookOpen size={13} />, label: 'Pages', value: String(resource.pages) }] : []),
                ...(resource.isbn  ? [{ icon: <Hash size={13} />,     label: 'ISBN',  value: resource.isbn }] : []),
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-w-600">{icon}</span>
                  <span className="text-w-700">{label}:</span>
                  <span className="font-semibold text-w-950">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-w-100 text-w-950 rounded text-xs font-lato">{resource.category}</span>
            <span className="px-3 py-1 bg-w-100 text-w-950 rounded text-xs font-lato capitalize">{resource.format}</span>
            <span className="px-3 py-1 bg-w-100 text-w-950 rounded text-xs font-lato">{resource.language.toUpperCase()}</span>
            <span className="px-3 py-1 bg-w-100 text-w-950 rounded text-xs font-lato capitalize">{resource.type}</span>
          </div>
        </div>
      </div>

      {modal && (
        <BorrowModal
          resource={resource}
          mode={modal}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
