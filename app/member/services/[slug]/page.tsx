import { notFound } from 'next/navigation'
import { ProgramDetail } from '@/components/services/program-detail'
import { getPublicServices } from '@/lib/services/data'
import { requirePageAuth } from '@/lib/server/page-session'

/** One programme inside the member portal. */
export default async function MemberProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { programs, areas }] = await Promise.all([params, getPublicServices(), requirePageAuth()])
  const program = programs.find((p) => p.slug === slug)
  if (!program) notFound()
  return <ProgramDetail program={program} others={programs.filter((p) => p.id !== program.id)} areas={areas} basePath="/member/services" signedIn />
}
