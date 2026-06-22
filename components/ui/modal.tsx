'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-w-950/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-lg border border-w-300 w-full ${sizeMap[size]} shadow-xl flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-w-300 shrink-0">
          <h2 className="font-cinzel text-base font-semibold text-w-950">{title}</h2>
          <button
            onClick={onClose}
            className="text-w-600 hover:text-w-950 transition-colors p-1 rounded hover:bg-w-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
