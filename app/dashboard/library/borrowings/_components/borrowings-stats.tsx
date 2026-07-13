import type { Borrowing } from './borrowings-data'

interface BorrowingsStatsProps {
  data: Borrowing[]
}

/** Stat card row summarizing the current borrowings list by status. */
export function BorrowingsStats({ data }: BorrowingsStatsProps) {
  const stats = [
    { label: 'Total', value: data.length, color: 'text-w-950' },
    { label: 'Active', value: data.filter((r) => r.status === 'active').length, color: 'text-green-700' },
    { label: 'Overdue', value: data.filter((r) => r.status === 'overdue').length, color: 'text-red-700' },
    { label: 'Pending', value: data.filter((r) => r.status === 'pending').length, color: 'text-yellow-700' },
    { label: 'Returned', value: data.filter((r) => r.status === 'returned').length, color: 'text-w-600' },
    { label: 'Unpaid Fines', value: data.filter((r) => r.fineAmount && !r.finePaid).length, color: 'text-orange-700' },
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
