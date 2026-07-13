import type { Invitation } from './invitations-data'

interface InvitationsStatsProps {
  invitations: Invitation[]
}

/** Pending/Accepted/Expired stat cards, derived from the same list state the table below renders — so Resend/Cancel/a new invite update these counts immediately. */
export function InvitationsStats({ invitations }: InvitationsStatsProps) {
  const stats = [
    { label: 'Total Invitations', value: invitations.length, color: 'text-w-950' },
    { label: 'Pending', value: invitations.filter((i) => i.status === 'PENDING').length, color: 'text-yellow-700' },
    { label: 'Accepted', value: invitations.filter((i) => i.status === 'ACCEPTED').length, color: 'text-green-700' },
    { label: 'Expired', value: invitations.filter((i) => i.status === 'EXPIRED').length, color: 'text-w-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
