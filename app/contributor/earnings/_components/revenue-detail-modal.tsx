import { Percent, DollarSign, Receipt } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { payoutStatusConfig, type BookRevenueRow, type PayoutRow } from './earnings-data'

interface RevenueDetailModalProps {
  row: BookRevenueRow | null
  /** The payout matching this row's earnings amount, if one has been issued yet. */
  matchingPayout: PayoutRow | undefined
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 90 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/** Read-only details view for a single publication's revenue split, plus its corresponding payout status if issued. */
export function RevenueDetailModal({ row, matchingPayout, onClose }: RevenueDetailModalProps) {
  return (
    <Modal open={!!row} onClose={onClose} title="Revenue Details" size="sm">
      {row && (
        <div className="space-y-4">
          <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{row.publication}</h3>

          <div className="card space-y-2">
            <DetailRow icon={<Percent size={13} />} label="Your Share" value={`${row.contributorShare}%`} />
            <DetailRow icon={<DollarSign size={13} />} label="Total Revenue" value={`${row.totalRevenue.toLocaleString()} RWF`} />
            <DetailRow icon={<DollarSign size={13} />} label="Your Earnings" value={`${row.contributorEarnings.toLocaleString()} RWF`} />
          </div>

          <div>
            <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <Receipt size={12} /> Payout Status
            </p>
            {matchingPayout ? (
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${payoutStatusConfig[matchingPayout.status].cls}`}>
                  {payoutStatusConfig[matchingPayout.status].label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{matchingPayout.date} via {matchingPayout.method}</span>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payout issued for this publication yet.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
