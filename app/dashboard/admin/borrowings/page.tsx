'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'

// ── Types ─────────────────────────────────────────────────────────────────────
type BorrowStatus = 'pending' | 'active' | 'overdue' | 'returned' | 'rejected'

interface Borrowing {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  resourceTitle: string
  resourceType: string
  isbn: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: BorrowStatus
  renewalCount: number
  fineAmount: number | null
  finePaid: boolean
}

const statusConfig: Record<BorrowStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  active:   { label: 'Active',   cls: 'bg-green-50  text-green-800  border-green-200'  },
  overdue:  { label: 'Overdue',  cls: 'bg-red-50    text-red-800    border-red-200'    },
  returned: { label: 'Returned', cls: 'bg-w-50      text-w-700      border-w-300'      },
  rejected: { label: 'Rejected', cls: 'bg-w-100     text-w-600      border-w-300'      },
}

function daysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const initialData: Borrowing[] = [
  { id: 'b-001', memberId: 'u-101', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceTitle: 'The Pursuit of Knowledge', resourceType: 'Book',   isbn: '978-1234567890', borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: null, status: 'active',  renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-002', memberId: 'u-102', memberName: 'Amina Uwimana',        memberEmail: 'amina@example.com',    resourceTitle: 'Digital Transformation',    resourceType: 'E-Book', isbn: '978-0987654321', borrowDate: '2025-05-10', dueDate: '2025-05-24', returnDate: null, status: 'overdue', renewalCount: 2, fineAmount: 1500, finePaid: false },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminBorrowingsPage() {
  const [data,        setData]        = useState<Borrowing[]>(initialData)
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | 'all'>('all')
  const [toast,       setToast]       = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const updateRow = (id: string, patch: Partial<Borrowing>) =>
    setData((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r))

  const handleApprove   = (b: Borrowing) => { updateRow(b.id, { status: 'active'   }); showToast(`Approved borrow for ${b.memberName}`) }
  const handleReject    = (b: Borrowing) => { updateRow(b.id, { status: 'rejected' }); showToast(`Rejected borrow for ${b.memberName}`) }
  const handleReturn    = (b: Borrowing) => {
    const fine = b.status === 'overdue' ? daysOverdue(b.dueDate) * 200 : null
    updateRow(b.id, { status: 'returned', returnDate: new Date().toISOString().split('T')[0], fineAmount: fine })
    showToast(`Return processed${fine ? ` — fine: ${fine.toLocaleString()} RWF` : ''}`)
  }
  const handleWaiveFine = (b: Borrowing) => { updateRow(b.id, { finePaid: true }); showToast(`Fine waived for ${b.memberName}`) }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const tableData = statusFilter === 'all' ? data : data.filter((r) => r.status === statusFilter)

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total',           value: data.length,                                          color: 'text-w-950'      },
    { label: 'Active',          value: data.filter((r) => r.status === 'active').length,     color: 'text-green-700'  },
    { label: 'Overdue',         value: data.filter((r) => r.status === 'overdue').length,    color: 'text-red-700'    },
    { label: 'Pending',         value: data.filter((r) => r.status === 'pending').length,    color: 'text-yellow-700' },
    { label: 'Returned',        value: data.filter((r) => r.status === 'returned').length,   color: 'text-w-600'      },
    { label: 'Unpaid Fines',    value: data.filter((r) => r.fineAmount && !r.finePaid).length, color: 'text-orange-700' },
  ]

  // ── Columns ───────────────────────────────────────────────────────────────
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
          <p className="font-semibold text-w-950 max-w-[200px] truncate">{b.resourceTitle}</p>
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
            <p className={b.status === 'overdue' ? 'text-red-700 font-semibold' : ''}>
              {b.returnDate ?? b.dueDate}
            </p>
            {days > 0 && (
              <p className="text-xs text-red-600 flex items-center gap-0.5">
                <AlertTriangle size={11} /> {days}d overdue
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (b) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[b.status].cls}`}>
          {statusConfig[b.status].label}
        </span>
      ),
    },
    {
      key: 'fineAmount', label: 'Fine (RWF)',
      render: (b) => b.fineAmount ? (
        <span className={b.finePaid ? 'text-w-500 line-through text-xs' : 'text-red-700 font-semibold'}>
          {b.fineAmount.toLocaleString()} {b.finePaid ? '(waived)' : 'RWF'}
        </span>
      ) : <span className="text-w-400 text-xs">—</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {b.status === 'pending' && (
            <>
              <button onClick={() => handleApprove(b)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => handleReject(b)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          {(b.status === 'active' || b.status === 'overdue') && (
            <button onClick={() => handleReturn(b)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <RotateCcw size={12} /> Return
            </button>
          )}
          {b.fineAmount && !b.finePaid && (
            <button onClick={() => handleWaiveFine(b)} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-lato hover:bg-orange-100 transition-colors">
              <AlertTriangle size={12} /> Waive Fine
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Borrowings Management" subtitle="All member borrowings — approve, track, process returns and fines" />

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

      <DataTable<Borrowing>
        data={tableData}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search member, book, ISBN, ID..."
        searchFilter={(r, q) =>
          r.memberName.toLowerCase().includes(q)    ||
          r.memberEmail.toLowerCase().includes(q)   ||
          r.resourceTitle.toLowerCase().includes(q) ||
          r.isbn.includes(q)                        ||
          r.id.toLowerCase().includes(q)
        }
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BorrowStatus | 'all')}
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusConfig) as BorrowStatus[]).map((s) => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
        }
        onExport={() => console.log('TODO: export CSV')}
        emptyMessage="No borrowings match your filters."
      />
    </div>
  )
}
