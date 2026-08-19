import { TransactionDetailView } from './_components/transaction-detail-view'

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params
  return <TransactionDetailView id={id} />
}
