'use client'

import { Bell } from 'lucide-react'
import { notificationCategoryGroups } from './notification-preferences-data'
import { useNotificationPreferences } from '@/app/member/_shared/use-notification-preferences'

interface NotificationPreferencesSectionProps {
  userId: string | undefined
}

/**
 * Real per-category email toggle list — backed by
 * useNotificationPreferences (GET/PATCH /api/users/[id]), which
 * lib/notify.ts's notifyUser() actually reads before sending any email.
 * Previously local useState only, never persisted, never gated anything.
 */
export function NotificationPreferencesSection({ userId }: NotificationPreferencesSectionProps) {
  const { data: enabled, save } = useNotificationPreferences(userId)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bell size={16} color="var(--gold)" /> Notification Preferences
      </div>
      {notificationCategoryGroups.map((group) => (
        <div key={group.section}>
          <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
            {group.section.toUpperCase()}
          </div>
          <div style={{ padding: '0 14px' }}>
            {group.categories.map((category) => {
              const isOn = enabled[category.id] ?? true
              return (
                <div
                  key={category.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{category.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {category.description}
                      {category.notYetTriggered && ' — not yet sent by anything in this app'}
                    </div>
                  </div>
                  <button
                    onClick={() => save(category.id, !isOn)}
                    role="switch"
                    aria-checked={isOn}
                    aria-label={`Toggle ${category.label} notifications`}
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
      ))}
    </div>
  )
}
