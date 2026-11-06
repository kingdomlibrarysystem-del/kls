import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProgramDetail } from '@/components/services/program-detail'
import { getProgramBySlug, getProgramProducts, getPublicServices } from '@/lib/services/data'
import { getPageSession } from '@/lib/server/page-session'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProgramBySlug((await params).slug)
  return p ? { title: p.name, description: p.tagline } : { title: 'Service not found' }
}

/** One programme, public. Its main button opens the real feature (members-only targets go through sign-in). */
export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const [{ programs, areas }, session] = await Promise.all([getPublicServices(), getPageSession()])
  const program = programs.find((p) => p.slug === slug)
  if (!program) notFound()
  // Products of the shop categories linked to this programme, and those picked on its sub-services.
  const { products, categories } = await getProgramProducts(program)
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProgramDetail program={program} others={programs.filter((p) => p.id !== program.id)} areas={areas} signedIn={!!session} products={products} categories={categories} shopPath="/shop" />
    </div>
  )
}
