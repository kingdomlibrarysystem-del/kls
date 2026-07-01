'use client'

import { useState, useEffect } from 'react'
import { Award } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockCertificates, type Certificate } from './certificates-data'

/** Simulated network delay before mock certificates become visible. */
const LOAD_DELAY_MS = 400

const columns: Column<Certificate>[] = [
  { key: 'member', label: 'Member', sortable: true, render: (c) => <span className="font-semibold text-w-950">{c.member}</span> },
  { key: 'course', label: 'Course', sortable: true, render: (c) => <span className="text-w-700">{c.course}</span> },
  { key: 'issuedAt', label: 'Issued', sortable: true, render: (c) => <span className="text-w-700">{c.issuedAt}</span> },
  {
    key: 'verificationCode', label: 'Verification Code', sortable: true,
    render: (c) => <span className="font-mono text-xs text-w-600 bg-w-100 px-2 py-0.5 rounded">{c.verificationCode}</span>,
  },
]

/** Table of issued certificates with a simulated initial load. */
export function CertificatesTable() {
  const [loading, setLoading] = useState(true)

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

  if (mockCertificates.length === 0) {
    return <EmptyState icon={Award} title="No certificates issued yet" description="Certificates will appear here once members complete courses." />
  }

  return (
    <DataTable<Certificate>
      data={mockCertificates}
      columns={columns}
      rowKey={(c) => c.id}
      searchPlaceholder="Search member, course, or code..."
      searchFilter={(c, q) =>
        c.member.toLowerCase().includes(q) ||
        c.course.toLowerCase().includes(q) ||
        c.verificationCode.toLowerCase().includes(q)
      }
      emptyMessage="No certificates match your search."
    />
  )
}
