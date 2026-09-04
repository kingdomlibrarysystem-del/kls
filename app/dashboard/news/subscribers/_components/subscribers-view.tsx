'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Users } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { Modal } from '@/components/ui/modal'
import { useNewsletterSubscribers, deleteSubscriber, exportSubscribersCsv, type NewsletterSubscriber } from '../../_shared/use-newsletter-subscribers'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function DeleteSubscriberModal({ subscriber, onClose }: { subscriber: NewsletterSubscriber | null; onClose: () => void }) {
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  if (!subscriber) return null

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteSubscriber(subscriber.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this subscriber')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Remove Subscriber" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm">
          <AlertTriangle size={16} /> This cannot be undone.
        </div>
        <p className="font-lato text-sm text-w-700">
          Remove <span className="font-semibold text-w-950">{subscriber.email}</span> from the newsletter list?
        </p>
        {error && <p className="font-lato text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="button" variant="primary" loading={deleting} className="bg-red-600 border-red-700 hover:bg-red-700" onClick={handleDelete}>Remove</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}

/** Newsletter subscriber management — homepage signups, staff-only. */
export function SubscribersView() {
  const { data, loading, error } = useNewsletterSubscribers()
  const [removing, setRemoving] = useState<NewsletterSubscriber | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading subscribers" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load subscribers" description={error} />

  const handleExport = async () => {
    try {
      await exportSubscribersCsv()
      showToast('Subscribers exported as CSV')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not export subscribers')
    }
  }

  const columns: Column<NewsletterSubscriber>[] = [
    { key: 'email', label: 'Email', sortable: true, render: (s) => <span className="font-semibold text-w-950 break-all">{s.email}</span> },
    { key: 'createdAt', label: 'Subscribed', sortable: true, render: (s) => <span className="text-w-700">{formatDate(s.createdAt)}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => (
        <button
          onClick={() => setRemoving(s)}
          className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"
        >
          <Trash2 size={12} /> Remove
        </button>
      ),
    },
  ]

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <div className="flex items-center gap-2 mb-4 text-w-700 font-lato text-sm">
        <Users size={15} /> {data.length} subscriber{data.length !== 1 ? 's' : ''}
      </div>
      <DataTable<NewsletterSubscriber>
        data={data}
        columns={columns}
        rowKey={(s) => s.id}
        searchPlaceholder="Search email..."
        searchFilter={(s, q) => s.email.toLowerCase().includes(q)}
        emptyMessage="No subscribers yet. The homepage newsletter form adds them here."
        onExport={handleExport}
      />
      <DeleteSubscriberModal subscriber={removing} onClose={() => setRemoving(null)} />
    </div>
  )
}