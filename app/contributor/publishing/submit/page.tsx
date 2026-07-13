import { PageTransition } from '@/components/ui/page-transition'
import { BookFormView } from './_components/book-form-view'

export default function SubmitBookPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        Submit a Book
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Save as a draft or submit directly for Manager review
      </p>
      <BookFormView />
    </PageTransition>
  )
}
