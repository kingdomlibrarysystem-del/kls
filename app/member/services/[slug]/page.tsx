import { notFound } from 'next/navigation'
import { ProgramDetail } from '@/components/services/program-detail'
import { getProgramProducts, getPublicServices } from '@/lib/services/data'
import { requirePageAuth } from '@/lib/server/page-session'

/** One programme inside the member portal. */
export default async function MemberProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { programs, areas }] = await Promise.all([params, getPublicServices(), requirePageAuth()])
  const program = programs.find((p) => p.slug === slug)
  if (!program) notFound()
  const { products, categories } = await getProgramProducts(program)
  return <ProgramDetail program={program} others={programs.filter((p) => p.id !== program.id)} areas={areas} basePath="/member/services" signedIn products={products} categories={categories} shopPath="/member/shop" />
}
