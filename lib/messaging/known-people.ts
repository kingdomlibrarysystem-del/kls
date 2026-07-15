import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import { CONTRIBUTOR_NAME } from '@/lib/identity/contributor-identity'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

export interface KnownPerson {
  name: string
  /**
   * Display-only label shown next to the name in the "start a new DM"
   * picker — deliberately NOT UserRole. A member can still start a DM
   * with a named lecturer/contributor persona (real, working chat), even
   * though neither has a signed-in UserRole seat after portal
   * consolidation — see roleForName()'s docstring for the same
   * distinction on the notification-routing side.
   */
  role: 'member' | 'lecturer' | 'contributor'
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
