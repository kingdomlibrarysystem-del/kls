import { CheckoutDetailView } from './_components/checkout-detail-view'

interface CheckoutDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CheckoutDetailPage({ params }: CheckoutDetailPageProps) {
  const { id } = await params
  return <CheckoutDetailView id={id} />
}
