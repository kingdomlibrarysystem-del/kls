export interface KnownPerson {
  id: string
  name: string
  role: string
}

/** Every real platform user except the current one, for the "start a new DM" picker — backed by the real /api/users directory. */
export async function knownPeopleExcluding(userId: string): Promise<KnownPerson[]> {
  const res = await fetch('/api/users?pageSize=1000')
  const json = await res.json()
  const users: { id: string; name: string; role: string }[] = json.data ?? []
  return users.filter((u) => u.id !== userId).map((u) => ({ id: u.id, name: u.name, role: u.role }))
}
