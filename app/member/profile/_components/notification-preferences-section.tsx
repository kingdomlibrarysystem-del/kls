'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { notificationCategories, defaultEnabledCategories } from './notification-preferences-data'

/**
 * Toggle list for notification categories, added as a new section on the
 * existing profile page. Local state only — no persistence across reload.
 */
export function NotificationPreferencesSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(defaultEnabledCategories)

  const toggle = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bell size={14} color="var(--gold)" /> Notification Preferences
      </div>
      <div style={{ padding: '4px 14px' }}>
        {notificationCategories.map((category) => {
          const isOn = enabled[category.id] ?? false
          return (
            <div
              key={category.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{category.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{category.description}</div>
              </div>
              <button
                onClick={() => toggle(category.id)}
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
  )
}
