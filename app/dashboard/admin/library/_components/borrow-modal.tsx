'use client'

import { X, BookOpen, CalendarClock } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { Resource } from './resource-card'

interface Props {
  resource: Resource
  mode: 'borrow' | 'reserve'
  onConfirm: () => void
  onClose: () => void
}

export function BorrowModal({ resource, mode, onConfirm, onClose }: Props) {
  const isBorrow = mode === 'borrow'
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-w-950/50">
      <div className="bg-white rounded-lg border border-w-300 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-w-300">
          <div className="flex items-center gap-2">
            {isBorrow ? <BookOpen size={18} className="text-w-600" /> : <CalendarClock size={18} className="text-w-600" />}
            <h2 className="font-cinzel text-base font-semibold text-w-950">
              {isBorrow ? 'Confirm Borrow' : 'Confirm Reservation'}
            </h2>
          </div>
          <button onClick={onClose} className="text-w-600 hover:text-w-950 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-form-highlight border border-w-300 rounded p-4">
            <p className="font-cinzel text-sm font-semibold text-w-950">{resource.title}</p>
            <p className="font-lato text-xs text-w-700 mt-1">by {resource.author}</p>
          </div>

          {isBorrow ? (
            <div className="space-y-2 font-lato text-sm text-w-700">
              <div className="flex justify-between">
                <span>Borrow period</span>
                <span className="font-semibold text-w-950">14 days</span>
              </div>
              <div className="flex justify-between">
                <span>Due date</span>
                <span className="font-semibold text-w-950">{dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Max renewals</span>
                <span className="font-semibold text-w-950">2</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 font-lato text-sm text-w-700">
              <p>You will be added to the waiting queue for this resource.</p>
              <p>You will receive a notification when it becomes available.</p>
              <p className="text-xs text-w-600">Claim window: 48 hours after notification.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-w-300">
          <ElegantButton variant="outline" className="flex-1" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton variant="primary" className="flex-1" onClick={onConfirm}>
            {isBorrow ? 'Confirm Borrow' : 'Confirm Reserve'}
          </ElegantButton>
        </div>
      </div>
    </div>
  )
}
