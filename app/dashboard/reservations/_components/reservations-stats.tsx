import type { Reservation } from './reservations-data'

interface ReservationsStatsProps {
  data: Reservation[]
}

/** Stat card row summarizing the current reservations list by status. */
export function ReservationsStats({ data }: ReservationsStatsProps) {
  const stats = [
    { label: 'Total', value: data.length, color: 'text-w-950' },
    { label: 'Waiting', value: data.filter((r) => r.status === 'pending').length, color: 'text-blue-700' },
    { label: 'Notified', value: data.filter((r) => r.status === 'notified').length, color: 'text-yellow-700' },
    { label: 'Claimed', value: data.filter((r) => r.status === 'claimed').length, color: 'text-green-700' },
    { label: 'Expired', value: data.filter((r) => r.status === 'expired').length, color: 'text-w-600' },
    { label: 'Cancelled', value: data.filter((r) => r.status === 'cancelled').length, color: 'text-red-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
