'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, BookText, Calendar, CalendarCheck, Hash, Package, Tag, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { RemoteImage } from '@/components/ui/remote-image'
import { statusConfig, type Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

interface BorrowingDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--gold)', marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
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
          <UniversalButton href="/member/borrowings" variant="gold-outline" icon={<ArrowLeft size={16} />}>
            Back to My Borrowings
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UniversalButton href="/member/borrowings" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>
        Back to My Borrowings
      </UniversalButton>

      <div className="card" style={{ display: 'flex', gap: 20, padding: 20, flexWrap: 'wrap', maxWidth: 680 }}>
        <Link
          href={`/member/library/resource/${borrowing.resourceId}`}
          style={{ width: 110, flexShrink: 0, position: 'relative', height: 154, borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}
        >
          {borrowing.resourceCover ? (
            <RemoteImage
              src={borrowing.resourceCover}
              alt={borrowing.resourceTitle}
              fill
              sizes="110px"
              className="object-cover"
              fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)' }}><Package size={28} color="var(--text-muted)" /></div>}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)' }}><Package size={28} color="var(--text-muted)" /></div>
          )}
        </Link>

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Link href={`/member/library/resource/${borrowing.resourceId}`} style={{ textDecoration: 'none' }}>
              <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {borrowing.resourceTitle}
              </h1>
            </Link>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
              {statusConfig[borrowing.status].label}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {borrowing.resourceAuthor && <DetailRow icon={<User size={15} />} label="Author" value={borrowing.resourceAuthor} />}
            {borrowing.resourceCategory && <DetailRow icon={<Tag size={15} />} label="Category" value={borrowing.resourceCategory} />}
            <DetailRow icon={<BookText size={15} />} label="Type" value={borrowing.resourceType} />
            <DetailRow icon={<Calendar size={15} />} label="Borrowed" value={borrowing.borrowDate} />
            <DetailRow
              icon={<CalendarCheck size={15} />}
              label={borrowing.status === 'returned' ? 'Was Due' : 'Due'}
              value={borrowing.dueDate}
            />
            {borrowing.returnDate && (
              <DetailRow icon={<CalendarCheck size={15} />} label="Returned" value={borrowing.returnDate} />
            )}
            <DetailRow icon={<Hash size={15} />} label="ISBN" value={borrowing.isbn} />
          </div>
        </div>
      </div>
    </div>
  )
}
