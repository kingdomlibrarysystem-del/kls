import { PageTransition } from '@/components/ui/page-transition'
import { MemberBookReader } from '../../_components/member-book-reader'

interface BookReaderPageProps {
  params: Promise<{ bookId: string }>
}

export default async function MemberLifeSciencesBookPage({ params }: BookReaderPageProps) {
  const { bookId } = await params
  return (
    <PageTransition>
      <MemberBookReader bookId={bookId} />
    </PageTransition>
  )
}
