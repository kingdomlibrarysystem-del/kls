import { AlertTriangle, TrendingUp, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ReportsSummaryCards } from './_components/reports-summary-cards'
import { OverdueTable, TopResourcesTable, FineCollectionTable } from './_components/reports-table'

export default function BorrowReportsPage() {
  return (
    <div>
      <PageHeader title="Borrow Reports" subtitle="Overdue items, top-borrowed resources, and fine collections" />

      <ReportsSummaryCards />

      <div className="space-y-8">
        <section>
          <h2 className="flex items-center gap-2 font-cinzel text-sm font-semibold text-w-950 mb-3">
            <AlertTriangle size={16} className="text-red-600" /> Overdue Items
          </h2>
          <OverdueTable />
        </section>

        <section>
          <h2 className="flex items-center gap-2 font-cinzel text-sm font-semibold text-w-950 mb-3">
            <TrendingUp size={16} className="text-w-600" /> Top-Borrowed Resources
          </h2>
          <TopResourcesTable />
        </section>

        <section>
          <h2 className="flex items-center gap-2 font-cinzel text-sm font-semibold text-w-950 mb-3">
            <Receipt size={16} className="text-orange-600" /> Fine Collection Summary
          </h2>
          <FineCollectionTable />
        </section>
      </div>
    </div>
  )
}
