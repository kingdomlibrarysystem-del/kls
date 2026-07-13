import { ReservationsView } from './_components/reservations-view'

export default function ReservationsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          My Reservations
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          View and manage your book reservations
        </div>
      </div>
      <ReservationsView />
    </div>
  )
}
