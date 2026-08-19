import { BorrowingDetailView } from './_components/borrowing-detail-view'

interface BorrowingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BorrowingDetailPage({ params }: BorrowingDetailPageProps) {
  const { id } = await params
  return <BorrowingDetailView id={id} />
}
