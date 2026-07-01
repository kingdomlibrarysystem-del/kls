export type TransactionType = 'SALE' | 'RENTAL'

export interface Transaction {
  id: string
  buyerName: string
  buyerEmail: string
  resourceTitle: string
  resourceFormat: string
  type: TransactionType
  amount: number
  date: string
}

export const typeConfig: Record<TransactionType, { label: string; cls: string }> = {
  SALE: { label: 'Sale', cls: 'bg-green-50 text-green-800 border-green-200' },
  RENTAL: { label: 'Rental', cls: 'bg-teal-50  text-teal-800  border-teal-200' },
}

export const initialData: Transaction[] = [
  { id: 'tx-001', buyerName: 'Jean Paul Nkurunziza', buyerEmail: 'jeanpaul@example.com', resourceTitle: 'The Pursuit of Knowledge', resourceFormat: 'E-Book', type: 'SALE', amount: 4500, date: '2026-06-02' },
  { id: 'tx-002', buyerName: 'Amina Uwimana', buyerEmail: 'amina@example.com', resourceTitle: 'Digital Transformation', resourceFormat: 'PDF Journal', type: 'RENTAL', amount: 1200, date: '2026-06-05' },
  { id: 'tx-003', buyerName: 'Eric Habimana', buyerEmail: 'eric@example.com', resourceTitle: 'Ancient Civilizations', resourceFormat: 'E-Book', type: 'SALE', amount: 5500, date: '2026-06-09' },
  { id: 'tx-004', buyerName: 'Grace Mukamana', buyerEmail: 'grace@example.com', resourceTitle: 'Modern Art & Culture', resourceFormat: 'Interactive PDF', type: 'RENTAL', amount: 900, date: '2026-06-12' },
  { id: 'tx-005', buyerName: 'David Ndayisenga', buyerEmail: 'david@example.com', resourceTitle: 'Introduction to Web Development', resourceFormat: 'E-Book', type: 'SALE', amount: 7000, date: '2026-06-15' },
  { id: 'tx-006', buyerName: 'Sarah Uwase', buyerEmail: 'sarah@example.com', resourceTitle: 'World History Essentials', resourceFormat: 'E-Book', type: 'RENTAL', amount: 1000, date: '2026-06-18' },
  { id: 'tx-007', buyerName: 'Patrick Iradukunda', buyerEmail: 'patrick@example.com', resourceTitle: 'The Pursuit of Knowledge', resourceFormat: 'E-Book', type: 'RENTAL', amount: 1500, date: '2026-06-21' },
  { id: 'tx-008', buyerName: 'Claudine Ingabire', buyerEmail: 'claudine@example.com', resourceTitle: 'Digital Transformation', resourceFormat: 'PDF Journal', type: 'SALE', amount: 6000, date: '2026-06-24' },
]
