import { PageTransition } from '@/components/ui/page-transition'
import { CertificateVerifyView } from './_components/certificate-verify-view'

interface CertificateVerifyPageProps {
  params: Promise<{ code: string }>
}

export default async function CertificateVerifyPage({ params }: CertificateVerifyPageProps) {
  const { code } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <PageTransition>
          <CertificateVerifyView code={decodeURIComponent(code)} />
        </PageTransition>
      </div>
    </div>
  )
}
