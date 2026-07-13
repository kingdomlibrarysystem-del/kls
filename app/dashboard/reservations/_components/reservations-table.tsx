import { Eye, Bell, ArrowRightCircle, XCircle, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { statusConfig, type Reservation, type ReservationStatus } from './reservations-data'
import { QueueBadge, ClaimCountdown } from './reservation-helpers'

interface ReservationsTableProps {
  data: Reservation[]
  statusFilter: ReservationStatus | 'all'
  onStatusFilterChange: (value: ReservationStatus | 'all') => void
  onView: (reservation: Reservation) => void
  onNotify: (reservation: Reservation) => void
  onConvertToBorrow: (reservation: Reservation) => void
  onCancel: (reservation: Reservation) => void
  onExpire: (reservation: Reservation) => void
}

/** DataTable of reservations with View + the existing notify/convert/cancel/expire actions. */
export function ReservationsTable({ data, statusFilter, onStatusFilterChange, onView, onNotify, onConvertToBorrow, onCancel, onExpire }: ReservationsTableProps) {
  const tableData = statusFilter === 'all' ? data : data.filter((r) => r.status === statusFilter)

  const columns: Column<Reservation>[] = [
    {
      key: 'queuePosition', label: 'Queue', sortable: true,
      render: (r) => (['pending', 'notified'].includes(r.status) ? <QueueBadge position={r.queuePosition} /> : <span className="text-w-400 text-xs">—</span>),
    },
    {
      key: 'memberName', label: 'Member', sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-w-950">{r.memberName}</p>
          <p className="text-xs text-w-600">{r.memberEmail}</p>
        </div>
      ),
    },
    {
      key: 'resourceTitle', label: 'Resource', sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-w-950 max-w-45 truncate">{r.resourceTitle}</p>
          <p className="text-xs text-w-600">{r.resourceAuthor} · {r.resourceType}</p>
        </div>
      ),
    },
    {
      key: 'totalCopies', label: 'Stock', sortable: false,
      render: (r) => (
        <div>
          <p className="text-xs font-lato"><span className="text-red-700 font-semibold">{r.borrowedCopies}</span><span className="text-w-600"> / {r.totalCopies} borrowed</span></p>
          <p className={`text-xs font-lato ${r.totalCopies - r.borrowedCopies === 0 ? 'text-red-600' : 'text-green-700'}`}>{r.totalCopies - r.borrowedCopies} available</p>
        </div>
      ),
    },
    {
      key: 'reservationDate', label: 'Reserved On', sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm">{r.reservationDate}</p>
          {r.notifiedAt && <p className="text-xs text-w-600">Notified: {new Date(r.notifiedAt).toLocaleDateString()}</p>}
        </div>
      ),
    },
    {
      key: 'claimDeadline', label: 'Claim Window', sortable: false,
      render: (r) => {
        if (r.status === 'notified' && r.claimDeadline) {
          return (
            <div className="space-y-0.5">
              <p className="text-xs text-w-700">Due: {new Date(r.claimDeadline).toLocaleDateString()}</p>
              <ClaimCountdown deadline={r.claimDeadline} />
            </div>
          )
        }
        if (r.status === 'expired') return <span className="flex items-center gap-1 text-xs text-w-500 font-lato"><AlertTriangle size={11} /> Window closed</span>
        return <span className="text-w-400 text-xs">—</span>
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}>{statusConfig[r.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button onClick={() => onView(r)} aria-label={`View reservation for ${r.memberName}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
            <Eye size={12} /> View
          </button>
          {r.status === 'pending' && r.queuePosition === 1 && (r.totalCopies - r.borrowedCopies) > 0 && (
            <button onClick={() => onNotify(r)} className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-xs font-lato hover:bg-yellow-100 transition-colors">
              <Bell size={12} /> Notify
            </button>
          )}
          {r.status === 'pending' && (
            <button onClick={() => onCancel(r)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <XCircle size={12} /> Cancel
            </button>
          )}
          {r.status === 'notified' && (
            <>
              <button onClick={() => onConvertToBorrow(r)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
                <ArrowRightCircle size={12} /> Convert to Borrow
              </button>
              <button onClick={() => onExpire(r)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
                <AlertTriangle size={12} /> Expire
              </button>
            </>
          )}
          {r.status === 'expired' && <span className="text-xs text-w-500 font-lato italic">Notify next in queue</span>}
        </div>
      ),
    },
  ]

  return (
    <DataTable<Reservation>
      data={tableData}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search member, book, email..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.memberEmail.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q) || r.resourceAuthor.toLowerCase().includes(q)}
      filters={
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as ReservationStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
          <option value="all">All Statuses</option>
          {(Object.keys(statusConfig) as ReservationStatus[]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
        </select>
      }
      emptyMessage="No reservations match your filters."
      defaultPageSize={10}
    />
  )
}
