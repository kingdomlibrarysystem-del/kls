'use client'

import { useState, useEffect } from 'react'
import { Bell, ArrowRightCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'

// ── Types ─────────────────────────────────────────────────────────────────────
type ReservationStatus = 'pending' | 'notified' | 'claimed' | 'expired' | 'cancelled'

interface Reservation {
  id: string
  // Member
  memberId: string
  memberName: string
  memberEmail: string
  // Resource
  resourceId: string
  resourceTitle: string
  resourceAuthor: string
  resourceType: string
  totalCopies: number
  borrowedCopies: number
  // Queue
  queuePosition: number
  reservationDate: string
  // Notification
  notifiedAt: string | null
  claimDeadline: string | null   // 48h after notifiedAt
  // Status
  status: ReservationStatus
}

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<ReservationStatus, { label: string; cls: string }> = {
  pending:   { label: 'Waiting',          cls: 'bg-blue-50   text-blue-800   border-blue-200'   },
  notified:  { label: 'Notified — Claim', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  claimed:   { label: 'Claimed',          cls: 'bg-green-50  text-green-800  border-green-200'  },
  expired:   { label: 'Expired',          cls: 'bg-w-100     text-w-600      border-w-300'      },
  cancelled: { label: 'Cancelled',        cls: 'bg-red-50    text-red-700    border-red-200'    },
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// claimDeadline is set 48h from notifiedAt for "notified" rows
const now = new Date()
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split('T')[0]

const initialData: Reservation[] = [
  {
    id: 'r-001',
    memberId: 'u-101', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com',
    resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book',
    totalCopies: 4, borrowedCopies: 4,
    queuePosition: 1, reservationDate: daysAgo(5),
    notifiedAt: daysAgo(0), claimDeadline: hoursFromNow(31),
    status: 'notified',
  },
  {
    id: 'r-002',
    memberId: 'u-102', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com',
    resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book',
    totalCopies: 4, borrowedCopies: 4,
    queuePosition: 2, reservationDate: daysAgo(3),
    notifiedAt: null, claimDeadline: null,
    status: 'pending',
  },
  {
    id: 'r-003',
    memberId: 'u-103', memberName: 'Patrick Habimana', memberEmail: 'patrick@example.com',
    resourceId: 'res-7', resourceTitle: "Inzira y'Ubumenyi", resourceAuthor: 'Dr. Kamanzi Pierre', resourceType: 'Book',
    totalCopies: 3, borrowedCopies: 3,
    queuePosition: 1, reservationDate: daysAgo(8),
    notifiedAt: null, claimDeadline: null,
    status: 'pending',
  },
  {
    id: 'r-004',
    memberId: 'u-104', memberName: 'Grace Mukamana', memberEmail: 'grace@example.com',
    resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book',
    totalCopies: 4, borrowedCopies: 4,
    queuePosition: 3, reservationDate: daysAgo(1),
    notifiedAt: null, claimDeadline: null,
    status: 'pending',
  },
  {
    id: 'r-005',
    memberId: 'u-105', memberName: 'Eric Nsanzimana', memberEmail: 'eric@example.com',
    resourceId: 'res-2', resourceTitle: 'Digital Transformation', resourceAuthor: 'Sarah Johnson', resourceType: 'E-Book',
    totalCopies: 10, borrowedCopies: 10,
    queuePosition: 1, reservationDate: daysAgo(2),
    notifiedAt: daysAgo(3), claimDeadline: hoursFromNow(-5),  // already expired
    status: 'expired',
  },
  {
    id: 'r-006',
    memberId: 'u-106', memberName: 'Diane Uwase', memberEmail: 'diane@example.com',
    resourceId: 'res-2', resourceTitle: 'Digital Transformation', resourceAuthor: 'Sarah Johnson', resourceType: 'E-Book',
    totalCopies: 10, borrowedCopies: 10,
    queuePosition: 1, reservationDate: daysAgo(10),
    notifiedAt: daysAgo(5), claimDeadline: daysAgo(4),
    status: 'claimed',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function claimCountdown(deadline: string): { label: string; urgent: boolean } {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return { label: 'Expired', urgent: true }
  const hrs  = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  const urgent = hrs < 6
  if (hrs >= 24) return { label: `${Math.floor(hrs / 24)}d ${hrs % 24}h left`, urgent }
  return { label: `${hrs}h ${mins}m left`, urgent }
}

function QueueBadge({ position }: { position: number }) {
  const colors = ['bg-w-600 text-white', 'bg-w-400 text-w-950', 'bg-w-200 text-w-950']
  const cls = colors[position - 1] ?? 'bg-w-100 text-w-700'
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-cinzel font-bold ${cls}`}>
      #{position}
    </span>
  )
}

// ── Countdown ticker ──────────────────────────────────────────────────────────
function ClaimCountdown({ deadline }: { deadline: string }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])
  const { label, urgent } = claimCountdown(deadline)
  return (
    <span className={`flex items-center gap-1 text-xs font-lato font-semibold ${urgent ? 'text-red-700' : 'text-yellow-700'}`}>
      <Clock size={11} /> {label}
      {tick < 0 && null /* keep tick in scope */}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminReservationsPage() {
  const [data,         setData]         = useState<Reservation[]>(initialData)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [toast,        setToast]        = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const updateRow = (id: string, patch: Partial<Reservation>) =>
    setData((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r))

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleNotify = (r: Reservation) => {
    const deadline = hoursFromNow(48)
    updateRow(r.id, {
      status: 'notified',
      notifiedAt: new Date().toISOString(),
      claimDeadline: deadline,
    })
    showToast(`Notification sent to ${r.memberName} — 48h claim window started.`)
  }

  const handleConvertToBorrow = (r: Reservation) => {
    updateRow(r.id, { status: 'claimed' })
    showToast(`Reservation converted to active borrow for ${r.memberName}.`)
  }

  const handleCancel = (r: Reservation) => {
    updateRow(r.id, { status: 'cancelled', claimDeadline: null })
    // Re-number queue for same resource
    setData((prev) => {
      const sameResource = prev
        .filter((x) => x.resourceId === r.resourceId && x.status === 'pending' && x.id !== r.id)
        .sort((a, b) => a.queuePosition - b.queuePosition)
      return prev.map((x) => {
        const idx = sameResource.findIndex((s) => s.id === x.id)
        return idx >= 0 ? { ...x, queuePosition: idx + 1 } : x
      })
    })
    showToast(`Reservation cancelled for ${r.memberName}. Queue updated.`)
  }

  const handleExpire = (r: Reservation) => {
    updateRow(r.id, { status: 'expired' })
    showToast(`Reservation expired for ${r.memberName}. Next in queue will be notified.`)
  }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const tableData = statusFilter === 'all' ? data : data.filter((r) => r.status === statusFilter)

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total',          value: data.length,                                           color: 'text-w-950'      },
    { label: 'Waiting',        value: data.filter((r) => r.status === 'pending').length,     color: 'text-blue-700'   },
    { label: 'Notified',       value: data.filter((r) => r.status === 'notified').length,    color: 'text-yellow-700' },
    { label: 'Claimed',        value: data.filter((r) => r.status === 'claimed').length,     color: 'text-green-700'  },
    { label: 'Expired',        value: data.filter((r) => r.status === 'expired').length,     color: 'text-w-600'      },
    { label: 'Cancelled',      value: data.filter((r) => r.status === 'cancelled').length,   color: 'text-red-700'    },
  ]

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<Reservation>[] = [
    {
      key: 'queuePosition', label: 'Queue', sortable: true,
      render: (r) => (
        ['pending', 'notified'].includes(r.status)
          ? <QueueBadge position={r.queuePosition} />
          : <span className="text-w-400 text-xs">—</span>
      ),
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
          <p className="font-semibold text-w-950 max-w-[180px] truncate">{r.resourceTitle}</p>
          <p className="text-xs text-w-600">{r.resourceAuthor} · {r.resourceType}</p>
        </div>
      ),
    },
    {
      key: 'totalCopies', label: 'Stock', sortable: false,
      render: (r) => (
        <div>
          <p className="text-xs font-lato">
            <span className="text-red-700 font-semibold">{r.borrowedCopies}</span>
            <span className="text-w-600"> / {r.totalCopies} borrowed</span>
          </p>
          <p className={`text-xs font-lato ${r.totalCopies - r.borrowedCopies === 0 ? 'text-red-600' : 'text-green-700'}`}>
            {r.totalCopies - r.borrowedCopies} available
          </p>
        </div>
      ),
    },
    {
      key: 'reservationDate', label: 'Reserved On', sortable: true,
      render: (r) => (
        <div>
          <p className="text-sm">{r.reservationDate}</p>
          {r.notifiedAt && (
            <p className="text-xs text-w-600">
              Notified: {new Date(r.notifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'claimDeadline', label: 'Claim Window', sortable: false,
      render: (r) => {
        if (r.status === 'notified' && r.claimDeadline) {
          return (
            <div className="space-y-0.5">
              <p className="text-xs text-w-700">
                Due: {new Date(r.claimDeadline).toLocaleDateString()}
              </p>
              <ClaimCountdown deadline={r.claimDeadline} />
            </div>
          )
        }
        if (r.status === 'expired') {
          return (
            <span className="flex items-center gap-1 text-xs text-w-500 font-lato">
              <AlertTriangle size={11} /> Window closed
            </span>
          )
        }
        return <span className="text-w-400 text-xs">—</span>
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}>
          {statusConfig[r.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">

          {/* Pending: notify the #1 person in queue when a copy is free */}
          {r.status === 'pending' && r.queuePosition === 1 && (r.totalCopies - r.borrowedCopies) > 0 && (
            <button
              onClick={() => handleNotify(r)}
              className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-xs font-lato hover:bg-yellow-100 transition-colors"
            >
              <Bell size={12} /> Notify
            </button>
          )}

          {/* Pending non-#1: can still cancel */}
          {r.status === 'pending' && (
            <button
              onClick={() => handleCancel(r)}
              className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
            >
              <XCircle size={12} /> Cancel
            </button>
          )}

          {/* Notified: convert to borrow (member arrived) or expire (window passed) */}
          {r.status === 'notified' && (
            <>
              <button
                onClick={() => handleConvertToBorrow(r)}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors"
              >
                <ArrowRightCircle size={12} /> Convert to Borrow
              </button>
              <button
                onClick={() => handleExpire(r)}
                className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
              >
                <AlertTriangle size={12} /> Expire
              </button>
            </>
          )}

          {/* Expired: notify next person in queue */}
          {r.status === 'expired' && (
            <span className="text-xs text-w-500 font-lato italic">Notify next in queue</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Reservations Management"
        subtitle="Manage the waiting queue — notify members, convert to borrows, track claim windows"
      />

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

      {/* How it works — quick reference for staff */}
      <div className="bg-w-50 border border-w-200 rounded-lg px-5 py-3 mb-5">
        <p className="font-cinzel text-xs font-semibold text-w-950 mb-1.5">Reservation Workflow</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-lato text-xs text-w-700">
          <span>1. Member reserves unavailable resource → <strong>Waiting</strong></span>
          <span>2. Copy returned → Notify #1 in queue → <strong>Notified</strong></span>
          <span>3. Member claims within 48h → <strong>Convert to Borrow</strong></span>
          <span>4. No claim after 48h → <strong>Expire</strong> → notify next in queue</span>
        </div>
      </div>

      <DataTable<Reservation>
        data={tableData}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search member, book, email..."
        searchFilter={(r, q) =>
          r.memberName.toLowerCase().includes(q)    ||
          r.memberEmail.toLowerCase().includes(q)   ||
          r.resourceTitle.toLowerCase().includes(q) ||
          r.resourceAuthor.toLowerCase().includes(q)
        }
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'all')}
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusConfig) as ReservationStatus[]).map((s) => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
        }
        onExport={() => console.log('TODO: export CSV')}
        emptyMessage="No reservations match your filters."
        defaultPageSize={10}
      />
    </div>
  )
}
