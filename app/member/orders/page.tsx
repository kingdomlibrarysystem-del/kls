import { OrdersView } from './_components/orders-view'

export default function OrdersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          My Orders
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Track your book purchases and rentals
        </div>
      </div>
      <OrdersView />
    </div>
  )
}
