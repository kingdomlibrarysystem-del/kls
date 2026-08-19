import { Eye, CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, daysOverdue, type Borrowing, type BorrowStatus } from './borrowings-data'

interface BorrowingsTableProps {
  data: Borrowing[]
  statusFilter: BorrowStatus | 'all'
  onStatusFilterChange: (value: BorrowStatus | 'all') => void
  onApprove: (borrowing: Borrowing) => void
  onReject: (borrowing: Borrowing) => void
  onReturn: (borrowing: Borrowing) => void
  onWaiveFine: (borrowing: Borrowing) => void
}

/** DataTable of borrowings with View + the existing approve/reject/return/waive-fine actions. */
export function BorrowingsTable({ data, statusFilter, onStatusFilterChange, onApprove, onReject, onReturn, onWaiveFine }: BorrowingsTableProps) {
  const tableData = statusFilter === 'all' ? data : data.filter((r) => r.status === statusFilter)

  const columns: Column<Borrowing>[] = [
    {
      key: 'memberName', label: 'Member', sortable: true,
      render: (b) => (
        <div>
          <p className="font-semibold text-w-950">{b.memberName}</p>
          <p className="text-xs text-w-600">{b.memberEmail}</p>
        </div>
      ),
    },
    {
      key: 'resourceTitle', label: 'Resource', sortable: true,
      render: (b) => (
        <div>
          <p className="font-semibold text-w-950 max-w-50 truncate">{b.resourceTitle}</p>
          <p className="text-xs text-w-600">{b.resourceType} · {b.isbn}</p>
        </div>
      ),
    },
    {
      key: 'borrowDate', label: 'Borrowed', sortable: true,
      render: (b) => (
        <div>
          <p>{b.borrowDate}</p>
          {b.renewalCount > 0 && <p className="text-xs text-w-600">Renewed ×{b.renewalCount}</p>}
        </div>
      ),
    },
    {
      key: 'dueDate', label: 'Due / Returned', sortable: true,
      render: (b) => {
        const days = b.status === 'overdue' ? daysOverdue(b.dueDate) : 0
        return (
          <div>
            <p className={b.status === 'overdue' ? 'text-red-700 font-semibold' : ''}>{b.returnDate ?? b.dueDate}</p>
            {days > 0 && <p className="text-xs text-red-600 flex items-center gap-0.5"><AlertTriangle size={11} /> {days}d overdue</p>}
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (b) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[b.status].cls}`}>{statusConfig[b.status].label}</span>,
    },
    {
      key: 'fineAmount', label: 'Fine (RWF)',
      render: (b) => b.fineAmount ? (
        <span className={b.finePaid ? 'text-w-500 line-through text-xs' : 'text-red-700 font-semibold'}>{b.fineAmount.toLocaleString()} {b.finePaid ? '(waived)' : 'RWF'}</span>
      ) : <span className="text-w-400 text-xs">—</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton
            href={`/dashboard/library/borrowings/${b.id}`}
            aria-label={`View borrowing for ${b.memberName}`}
            variant="secondary"
            size="sm"
            icon={<Eye size={12} />}
            className="!px-2.5 !py-1 !text-xs"
          >
            View
          </UniversalButton>
          {b.status === 'pending' && (
            <>
              <button onClick={() => onApprove(b)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => onReject(b)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          {(b.status === 'active' || b.status === 'overdue') && (
            <button onClick={() => onReturn(b)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <RotateCcw size={12} /> Return
            </button>
          )}
          {b.fineAmount && !b.finePaid && (
            <button onClick={() => onWaiveFine(b)} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-lato hover:bg-orange-100 transition-colors">
              <AlertTriangle size={12} /> Waive Fine
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<Borrowing>
      data={tableData}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search member, book, ISBN, ID..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.memberEmail.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q) || r.isbn.includes(q) || r.id.toLowerCase().includes(q)}
      filters={
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as BorrowStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
          <option value="all">All Statuses</option>
          {(Object.keys(statusConfig) as BorrowStatus[]).map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
        </select>
      }
      emptyMessage="No borrowings match your filters."
    />
  )
}
