import { MemberBookReader } from '@/app/member/life-sciences/_components/member-book-reader'

interface PublicLifeSciencesBookPageProps {
  params: Promise<{ bookId: string }>
}

export const metadata = { title: 'Life Sciences Book' }

/** Public, guest-visible reader for a single Life Sciences book. */
export default async function PublicLifeSciencesBookPage({ params }: PublicLifeSciencesBookPageProps) {
  const { bookId } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <MemberBookReader bookId={bookId} basePath="/life-sciences" />
      </div>
    </div>
  )
}
