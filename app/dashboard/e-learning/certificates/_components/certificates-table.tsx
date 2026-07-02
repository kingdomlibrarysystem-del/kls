'use client'

import { useState, useEffect } from 'react'
import { Award, Eye, ShieldOff } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useCertificates, revokeCertificate } from './use-certificates'
import type { Certificate } from './certificates-data'
import { CertificateDetailModal } from './certificate-detail-modal'
import { RevokeCertificateModal } from './revoke-certificate-modal'

/** Simulated network delay before mock certificates become visible. */
const LOAD_DELAY_MS = 400

function buildColumns(onView: (c: Certificate) => void, onRevoke: (c: Certificate) => void): Column<Certificate>[] {
  return [
    { key: 'member', label: 'Member', sortable: true, render: (c) => <span className="font-semibold text-w-950">{c.member}</span> },
    { key: 'course', label: 'Course', sortable: true, render: (c) => <span className="text-w-700">{c.course}</span> },
    { key: 'issuedAt', label: 'Issued', sortable: true, render: (c) => <span className="text-w-700">{c.issuedAt}</span> },
    {
      key: 'verificationCode', label: 'Verification Code', sortable: true,
      render: (c) => <span className="font-mono text-xs text-w-600 bg-w-100 px-2 py-0.5 rounded">{c.verificationCode}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (c) => c.revoked
        ? <span className="px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-red-50 text-red-800 border-red-200">Revoked</span>
        : <span className="px-2.5 py-0.5 rounded border text-xs font-lato font-semibold bg-green-50 text-green-800 border-green-200">Valid</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => onView(c)} aria-label={`View certificate for ${c.member}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Eye size={14} />
          </button>
          {!c.revoked && (
            <button onClick={() => onRevoke(c)} aria-label={`Revoke certificate for ${c.member}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
              <ShieldOff size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]
}

/** Table of issued certificates with a simulated initial load, details view, and revoke action. */
export function CertificatesTable() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Certificate | null>(null)
  const [revoking, setRevoking] = useState<Certificate | null>(null)
  const certificates = useCertificates()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading certificates">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (certificates.length === 0) {
    return <EmptyState icon={Award} title="No certificates issued yet" description="Certificates will appear here once members complete courses." />
  }

  return (
    <>
      <DataTable<Certificate>
        data={certificates}
        columns={buildColumns(setViewing, setRevoking)}
        rowKey={(c) => c.id}
        searchPlaceholder="Search member, course, or code..."
        searchFilter={(c, q) =>
          c.member.toLowerCase().includes(q) ||
          c.course.toLowerCase().includes(q) ||
          c.verificationCode.toLowerCase().includes(q)
        }
        emptyMessage="No certificates match your search."
      />
      <CertificateDetailModal certificate={viewing} onClose={() => setViewing(null)} />
      <RevokeCertificateModal
        certificate={revoking}
        onClose={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) revokeCertificate(revoking.id)
          setRevoking(null)
        }}
      />
    </>
  )
}
