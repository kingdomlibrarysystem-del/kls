'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, BookText, Calendar, CalendarCheck, Hash } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, type Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

interface BorrowingDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--gold)', marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single borrowing, replacing the modal that used
 * to open from the member borrowings list. Fetches directly from
 * /api/borrowings/:id so this page also works when linked to directly.
 */
export function BorrowingDetailView({ id }: BorrowingDetailViewProps) {
  const [borrowing, setBorrowing] = useState<Borrowing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/borrowings/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Borrowing not found')
          return
        }
        setBorrowing(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load borrowing') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading borrowing">
        <Skeleton style={{ height: 32, width: 160, borderRadius: 6 }} />
        <Skeleton style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || !borrowing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={BookOpen}
          title="Borrowing not found"
          description={error || 'This borrowing does not exist or was removed.'}
          style={{ color: 'var(--text-secondary)' }}
        />
        <div>
          <UniversalButton href="/member/borrowings" variant="gold-outline" icon={<ArrowLeft size={14} />}>
            Back to My Borrowings
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UniversalButton href="/member/borrowings" variant="dim-outline" size="sm" icon={<ArrowLeft size={14} />}>
        Back to My Borrowings
      </UniversalButton>

      <div className="card space-y-4" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {borrowing.resourceTitle}
          </h1>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
            {statusConfig[borrowing.status].label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <DetailRow icon={<BookText size={13} />} label="Type" value={borrowing.resourceType} />
          <DetailRow icon={<Calendar size={13} />} label="Borrowed" value={borrowing.borrowDate} />
          <DetailRow
            icon={<CalendarCheck size={13} />}
            label={borrowing.status === 'returned' ? 'Was Due' : 'Due'}
            value={borrowing.dueDate}
          />
          {borrowing.returnDate && (
            <DetailRow icon={<CalendarCheck size={13} />} label="Returned" value={borrowing.returnDate} />
          )}
          <DetailRow icon={<Hash size={13} />} label="ISBN" value={borrowing.isbn} />
        </div>
      </div>
    </div>
  )
}
