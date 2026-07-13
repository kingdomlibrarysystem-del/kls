import { overdueList, topResources, fineCollection } from './reports-data'

export function ReportsSummaryCards() {
  const totalFines = fineCollection.reduce((sum, f) => sum + f.amount, 0)
  const unpaidFines = fineCollection.filter((f) => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0)
  const totalBorrowedToday = topResources.reduce((sum, r) => sum + r.borrowCount, 0)

  const stats = [
    { label: 'Total Borrowed (30d)', value: totalBorrowedToday,               color: 'text-w-950'      },
    { label: 'Overdue Items',        value: overdueList.length,                color: 'text-red-700'    },
    { label: 'Pending Returns',      value: overdueList.length,                color: 'text-yellow-700' },
    { label: 'Total Fines (RWF)',    value: totalFines.toLocaleString(),       color: 'text-w-600'      },
    { label: 'Unpaid Fines (RWF)',   value: unpaidFines.toLocaleString(),      color: 'text-orange-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
