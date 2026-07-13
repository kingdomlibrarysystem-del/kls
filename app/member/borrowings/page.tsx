import { BorrowingsView } from './_components/borrowings-view'

export default function BorrowingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          My Borrowings
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Track your borrowed books and return history
        </div>
      </div>
      <BorrowingsView />
    </div>
  )
}
