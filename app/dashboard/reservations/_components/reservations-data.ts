export type ReservationStatus = 'pending' | 'notified' | 'claimed' | 'expired' | 'cancelled'

export interface Reservation {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  resourceId: string
  resourceTitle: string
  resourceAuthor: string
  resourceType: string
  totalCopies: number
  borrowedCopies: number
  queuePosition: number
  reservationDate: string
  notifiedAt: string | null
  claimDeadline: string | null
  status: ReservationStatus
}

export const statusConfig: Record<ReservationStatus, { label: string; cls: string }> = {
  pending: { label: 'Waiting', cls: 'bg-blue-50   text-blue-800   border-blue-200' },
  notified: { label: 'Notified — Claim', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  claimed: { label: 'Claimed', cls: 'bg-green-50  text-green-800  border-green-200' },
  expired: { label: 'Expired', cls: 'bg-w-100     text-w-600      border-w-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50    text-red-700    border-red-200' },
}

// claimDeadline is set 48h from notifiedAt for "notified" rows
const now = new Date()
export const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split('T')[0]

export const initialData: Reservation[] = [
  { id: 'r-001', memberId: 'u-101', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book', totalCopies: 4, borrowedCopies: 4, queuePosition: 1, reservationDate: daysAgo(5), notifiedAt: daysAgo(0), claimDeadline: hoursFromNow(31), status: 'notified' },
  { id: 'r-002', memberId: 'u-102', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com', resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book', totalCopies: 4, borrowedCopies: 4, queuePosition: 2, reservationDate: daysAgo(3), notifiedAt: null, claimDeadline: null, status: 'pending' },
  { id: 'r-003', memberId: 'u-103', memberName: 'Patrick Habimana', memberEmail: 'patrick@example.com', resourceId: 'res-7', resourceTitle: "Inzira y'Ubumenyi", resourceAuthor: 'Dr. Kamanzi Pierre', resourceType: 'Book', totalCopies: 3, borrowedCopies: 3, queuePosition: 1, reservationDate: daysAgo(8), notifiedAt: null, claimDeadline: null, status: 'pending' },
  { id: 'r-004', memberId: 'u-104', memberName: 'Grace Mukamana', memberEmail: 'grace@example.com', resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceAuthor: 'Prof. Robert Anderson', resourceType: 'Book', totalCopies: 4, borrowedCopies: 4, queuePosition: 3, reservationDate: daysAgo(1), notifiedAt: null, claimDeadline: null, status: 'pending' },
  { id: 'r-005', memberId: 'u-105', memberName: 'Eric Nsanzimana', memberEmail: 'eric@example.com', resourceId: 'res-2', resourceTitle: 'Digital Transformation', resourceAuthor: 'Sarah Johnson', resourceType: 'E-Book', totalCopies: 10, borrowedCopies: 10, queuePosition: 1, reservationDate: daysAgo(2), notifiedAt: daysAgo(3), claimDeadline: hoursFromNow(-5), status: 'expired' },
  { id: 'r-006', memberId: 'u-106', memberName: 'Diane Uwase', memberEmail: 'diane@example.com', resourceId: 'res-2', resourceTitle: 'Digital Transformation', resourceAuthor: 'Sarah Johnson', resourceType: 'E-Book', totalCopies: 10, borrowedCopies: 10, queuePosition: 1, reservationDate: daysAgo(10), notifiedAt: daysAgo(5), claimDeadline: daysAgo(4), status: 'claimed' },
]

export function claimCountdown(deadline: string): { label: string; urgent: boolean } {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return { label: 'Expired', urgent: true }
  const hrs = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  const urgent = hrs < 6
  if (hrs >= 24) return { label: `${Math.floor(hrs / 24)}d ${hrs % 24}h left`, urgent }
  return { label: `${hrs}h ${mins}m left`, urgent }
}
