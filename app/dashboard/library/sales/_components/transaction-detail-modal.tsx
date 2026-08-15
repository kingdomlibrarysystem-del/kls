import { User, Mail, Smartphone, BookOpen, DollarSign, Calendar, Tag, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { typeConfig, statusConfig, type Transaction } from './sales-data'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single sales/rental order. */
export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  return (
    <Modal open={!!transaction} onClose={onClose} title="Transaction Details" size="md">
      {transaction && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{transaction.resourceTitle}</h3>
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${typeConfig[transaction.type].cls}`}>
                {typeConfig[transaction.type].label}
              </span>
              <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[transaction.status].cls}`}>
                {statusConfig[transaction.status].label}
              </span>
            </div>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<User size={13} />} label="Buyer" value={transaction.buyerName} />
            <DetailRow icon={<Mail size={13} />} label="Email" value={transaction.buyerEmail} />
            <DetailRow icon={<Smartphone size={13} />} label="Phone" value={transaction.buyerPhone} />
            <DetailRow icon={<BookOpen size={13} />} label="Format" value={transaction.resourceFormat} />
            <DetailRow icon={<Tag size={13} />} label="ID" value={transaction.id} />
            {transaction.paypackRef && <DetailRow icon={<Hash size={13} />} label="PayPack Ref" value={transaction.paypackRef} />}
            <DetailRow icon={<DollarSign size={13} />} label="Amount" value={`${transaction.amount.toLocaleString()} RWF`} />
            <DetailRow icon={<Calendar size={13} />} label="Date" value={transaction.date} />
          </div>
        </div>
      )}
    </Modal>
  )
}
