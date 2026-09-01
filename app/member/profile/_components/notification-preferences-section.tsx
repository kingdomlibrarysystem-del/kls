'use client'

import { Bell } from 'lucide-react'
import { notificationCategoryGroups } from './notification-preferences-data'
import { useNotificationPreferences } from '@/app/member/_shared/use-notification-preferences'
import { useLanguage } from '@/contexts/language-context'

interface NotificationPreferencesSectionProps {
  userId: string | undefined
}

/** Maps a category id (from notification-preferences-data) to its m_notif_prefs translation key. */
const categoryKeyMap: Record<string, string> = {
  'borrow-approved': 'borrow_approved',
  'borrow-rejected': 'borrow_rejected',
  'borrow-returned': 'borrow_returned',
  'due-reminders': 'due_reminders',
  'reservation-created': 'res_placed',
  'reservation-ready': 'res_ready',
  'course-enrollment': 'course_enrollment',
  'course-payment-success': 'course_pay_success',
  'course-payment-failed': 'course_pay_failed',
  'session-approved': 'session_approved',
  'session-rejected': 'session_rejected',
  'session-unavailable': 'session_unavailable',
  'session-reminder': 'session_reminders',
  'certificate-issued': 'cert_issued',
  'assessment-graded': 'assessment_graded',
  'publication-submitted': 'pub_submitted',
  'publication-approved': 'pub_approved',
  'publication-rejected': 'pub_rejected',
  'order-payment-success': 'order_pay_success',
  'order-payment-failed': 'order_pay_failed',
}

/** Maps a group.section name to its m_notif_prefs section-title key. */
const sectionKeyMap: Record<string, string> = {
  Borrowing: 'section_borrowing',
  Reservations: 'section_reservations',
  'Courses & Sessions': 'section_courses_sessions',
  Publications: 'section_publications',
  Payments: 'section_payments',
}

/**
 * Real per-category email toggle list — backed by
 * useNotificationPreferences (GET/PATCH /api/users/[id]), which
 * lib/notify.ts's notifyUser() actually reads before sending any email.
 * Previously local useState only, never persisted, never gated anything.
 */
export function NotificationPreferencesSection({ userId }: NotificationPreferencesSectionProps) {
  const { data: enabled, save } = useNotificationPreferences(userId)
  const { t } = useLanguage()

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bell size={16} color="var(--gold)" /> {t('m_notif_prefs.title')}
      </div>
      {notificationCategoryGroups.map((group) => {
        const sectionTitle = sectionKeyMap[group.section] ? t(`m_notif_prefs.${sectionKeyMap[group.section]}`) : group.section
        return (
          <div key={group.section}>
            <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
              {sectionTitle.toUpperCase()}
            </div>
            <div style={{ padding: '0 14px' }}>
              {group.categories.map((category) => {
                const isOn = enabled[category.id] ?? true
                const label = categoryKeyMap[category.id] ? t(`m_notif_prefs.${categoryKeyMap[category.id]}`) : category.label
                const description = categoryKeyMap[category.id] ? t(`m_notif_prefs.${categoryKeyMap[category.id]}_desc`) : category.description
                return (
                  <div
                    key={category.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {description}
                        {category.notYetTriggered && t('m_notif_prefs.not_yet_sent')}
                      </div>
                    </div>
                    <button
                      onClick={() => save(category.id, !isOn)}
                      role="switch"
                      aria-checked={isOn}
                      aria-label={`${t('m_notif_prefs.toggle')} ${label} ${t('m_notif_prefs.title')}`}
                      style={{
                        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                        background: isOn ? 'var(--gold)' : 'var(--bg-section)', position: 'relative', transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute', top: 2, left: isOn ? 18 : 2, width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', transition: 'left 0.15s',
                        }}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
