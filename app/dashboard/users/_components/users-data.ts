/** Platform user, per RULES.md dynamic-role model (role stored as a string, not a static enum). */
export type UserRoleValue = 'user' | 'librarian' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface PlatformUser {
  id: string
  name: string
  email: string
  role: UserRoleValue
  status: UserStatus
  joinDate: string
}

export const initialUsers: PlatformUser[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-01-10' },
  { id: '2', name: 'Bob Smith', email: 'bob@kingdom.edu', role: 'librarian', status: 'active', joinDate: '2024-02-15' },
  { id: '3', name: 'Carol Davis', email: 'carol@kingdom.edu', role: 'user', status: 'inactive', joinDate: '2024-03-20' },
  { id: '4', name: 'David Wilson', email: 'david@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-04-05' },
  { id: '5', name: 'Jean Paul Nkurunziza', email: 'jeanpaul@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-04-22' },
  { id: '6', name: 'Amina Uwimana', email: 'amina@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-05-03' },
  { id: '7', name: 'Eric Habimana', email: 'eric@kingdom.edu', role: 'librarian', status: 'active', joinDate: '2024-05-18' },
  { id: '8', name: 'Grace Mukamana', email: 'grace@kingdom.edu', role: 'user', status: 'suspended', joinDate: '2024-06-01' },
  { id: '9', name: 'Claudine Ingabire', email: 'claudine@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-06-14' },
  { id: '10', name: 'Patrick Iradukunda', email: 'patrick@kingdom.edu', role: 'user', status: 'inactive', joinDate: '2024-07-02' },
  { id: '11', name: 'Sarah Uwase', email: 'sarah@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-07-19' },
  { id: '12', name: 'David Ndayisenga', email: 'davidn@kingdom.edu', role: 'librarian', status: 'active', joinDate: '2024-08-05' },
  { id: '13', name: 'Emmanuel Rugamba', email: 'emmanuel@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-08-21' },
  { id: '14', name: 'Alice Mutoni', email: 'alicem@kingdom.edu', role: 'user', status: 'active', joinDate: '2024-09-09' },
]

export const roleColors: Record<UserRoleValue, string> = {
  user: 'bg-blue-50 text-blue-700 border-blue-200',
  librarian: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
}

export const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
}
