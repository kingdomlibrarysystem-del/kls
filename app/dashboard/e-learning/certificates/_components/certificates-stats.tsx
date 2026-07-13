import type { Certificate } from './certificates-data'

interface CertificatesStatsProps {
  data: Certificate[]
}

/** Total issued / valid / revoked stat cards, derived from the same live certificate list the table below renders. */
export function CertificatesStats({ data }: CertificatesStatsProps) {
  const revoked = data.filter((c) => c.revoked).length

  const stats = [
    { label: 'Total Issued', value: data.length, color: 'text-w-950' },
    { label: 'Valid', value: data.length - revoked, color: 'text-green-700' },
    { label: 'Revoked', value: revoked, color: 'text-red-700' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
