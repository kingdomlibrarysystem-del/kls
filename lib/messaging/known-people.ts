import type { UserRole } from '@/contexts/auth-context'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { CONTRIBUTOR_NAME } from '@/app/contributor/_components/contributor-identity'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

export interface KnownPerson {
  name: string
  role: UserRole
}

/**
 * Every named person this mock system knows about, for the "start a new
 * DM" picker — there's no general user directory, so this is assembled
 * from the same identity constants roleForName() resolves against
 * (lecturerRoster, CONTRIBUTOR_NAME, CURRENT_MEMBER_NAME).
 */
export function knownPeopleExcluding(name: string): KnownPerson[] {
  const all: KnownPerson[] = [
    { name: CURRENT_MEMBER_NAME, role: 'member' },
    { name: CONTRIBUTOR_NAME, role: 'contributor' },
    ...lecturerRoster.map((l) => ({ name: l.name, role: 'lecturer' as const })),
  ]
  return all.filter((p) => p.name !== name)
}
