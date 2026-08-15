import { Tag, Coins, Calendar, CheckCircle2, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { typeConfig, statusConfig, type MemberOrder } from './orders-data'

interface OrderDetailModalProps {
  order: MemberOrder | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/** Read-only details view for a single order (purchase or rental). */
export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <Modal open={!!order} onClose={onClose} title="Order Details" size="sm">
      {order && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{order.resourceTitle}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusConfig[order.status].color, flexShrink: 0 }}>
              {statusConfig[order.status].label}
            </span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<Tag size={13} />} label="Type" value={typeConfig[order.type].label} />
            <DetailRow icon={<Coins size={13} />} label="Amount" value={`${order.amount.toLocaleString()} RWF`} />
            <DetailRow icon={<Calendar size={13} />} label="Ordered" value={order.createdAt} />
            {order.paidAt && <DetailRow icon={<CheckCircle2 size={13} />} label="Paid" value={order.paidAt.split('T')[0]} />}
            <DetailRow icon={<Hash size={13} />} label="Order ID" value={order.id} />
          </div>
        </div>
      )}
    </Modal>
  )
}
