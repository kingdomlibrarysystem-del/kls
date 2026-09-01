'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useLoginHistory } from '@/app/member/_shared/use-login-history'
import type { LoginEvent } from './security-mock-data'

const columns: Column<LoginEvent>[] = [
  { key: 'date', label: 'Date', sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.date}</span> },
  { key: 'ip', label: 'IP Address', sortable: true, render: (e) => <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.ip}</span> },
  { key: 'device', label: 'Device', sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.device}</span> },
  {
    key: 'success', label: 'Result', sortable: true,
    render: (e) => (
      <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: e.success ? 'var(--green)' : 'var(--red)' }}>
        {e.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {e.success ? 'Success' : 'Failed'}
      </span>
    ),
  },
]

/** DataTable of real login events (date, IP, device, success/fail) from /api/login-history. */
export function LoginHistorySection() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data: loginHistory, loading, error } = useLoginHistory(user?.id)

  const columns: Column<LoginEvent>[] = [
    { key: 'date', label: t('m_profile.date'), sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.date}</span> },
    { key: 'ip', label: t('m_profile.ip_address'), sortable: true, render: (e) => <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.ip}</span> },
    { key: 'device', label: t('m_profile.device'), sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.device}</span> },
    {
      key: 'success', label: t('m_profile.result'), sortable: true,
      render: (e) => (
        <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: e.success ? 'var(--green)' : 'var(--red)' }}>
          {e.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {e.success ? t('m_profile.success') : t('common.failed')}
        </span>
      ),
    },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{t('m_profile.login_history')}</div>
      {loading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : error ? (
        <EmptyState icon={CheckCircle2} title={t('m_profile.could_not_load')} description={error} style={{ color: 'var(--text-secondary)' }} />
      ) : loginHistory.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t('m_profile.no_history')} description={t('m_profile.no_history_desc')} style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <DataTable<LoginEvent> data={loginHistory} columns={columns} rowKey={(e) => e.id} emptyMessage={t('m_profile.no_login_events')} />
      )}
    </div>
  )
}
