'use client'

import { useState } from 'react'
import { PlusCircle, Eye, Pencil, Archive, Star, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { UniversalButton } from '@/components/ui/universal-button'
import { campaignStatusConfig, type DonationCampaign } from '../../_shared/donations-data'
import { useCampaigns, archiveCampaign, toggleFeaturedCampaign } from '../../_shared/use-campaigns'
import { CampaignForm } from './campaign-form'

/** Campaign management — DataTable CRUD list, mirrors ArticlesView's shape. */
export function CampaignsView() {
  const { data, loading, error } = useCampaigns()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DonationCampaign | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading campaigns" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load campaigns" description={error} />

  const handleArchive = async (c: DonationCampaign) => {
    try { await archiveCampaign(c.id); showToast(`Archived "${c.title}"`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not archive this campaign') }
  }
  const handleToggleFeatured = async (c: DonationCampaign) => {
    try { await toggleFeaturedCampaign(c.id) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not update this campaign') }
  }

  const columns: Column<DonationCampaign>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (c) => <span className="font-semibold text-w-950 max-w-55 truncate block">{c.title}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (c) => <span className="text-w-700">{c.category}</span> },
    {
      key: 'progress', label: 'Progress', sortable: true,
      render: (c) => (
        <div className="w-32">
          <p className="text-xs text-w-700 mb-1">{c.raisedRwf.toLocaleString()} / {c.goalRwf.toLocaleString()} RWF</p>
          <div className="w-full h-1.5 rounded-full bg-w-200 overflow-hidden"><div className="h-full bg-w-600" style={{ width: `${Math.min(100, (c.raisedRwf / c.goalRwf) * 100)}%` }} /></div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (c) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${campaignStatusConfig[c.status].cls}`}>{campaignStatusConfig[c.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/donations/campaigns/${c.id}`} aria-label={`View ${c.title}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          <button onClick={() => { setEditing(c); setFormOpen(true) }} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"><Pencil size={12} /> Edit</button>
          <button onClick={() => handleToggleFeatured(c)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"><Star size={12} className={c.featured ? 'text-yellow-500' : ''} fill={c.featured ? 'currentColor' : 'none'} /></button>
          {c.status === 'ACTIVE' && <button onClick={() => handleArchive(c)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"><Archive size={12} /> Archive</button>}
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <div className="flex justify-end mb-4">
        <ElegantButton variant="primary" onClick={() => { setEditing(null); setFormOpen(true) }} className="flex items-center gap-1.5"><PlusCircle size={15} /> New Campaign</ElegantButton>
      </div>
      <DataTable<DonationCampaign>
        data={data}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search title or category..."
        searchFilter={(c, q) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)}
        emptyMessage="No campaigns yet."
      />
      <CampaignForm open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} />
    </div>
  )
}
