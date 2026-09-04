'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

interface UserMenuProps {
  /** Where "View Profile" navigates to. */
  profileHref: string
  /** Placement of the dropdown relative to the trigger. */
  align?: 'left' | 'right'
}

/**
 * Compact user avatar + dropdown: "View Profile" + "Log Out".
 * Used at the bottom of both the member and admin sidebars.
 */
export function UserMenu({ profileHref, align = 'right' }: UserMenuProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: '10px 14px',
          textAlign: 'left',
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--teal))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {user.firstName[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold)', lineHeight: 1.2 }}>
            {user.roleName}
          </div>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            minWidth: 180,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          <a
            href={profileHref}
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            <User size={15} /> {t('m_profile.title')}
          </a>
          <button
            onClick={() => {
              setOpen(false)
              logout()
              router.push('/')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--red)',
              background: 'none',
              border: 'none',
              borderTop: '1px solid var(--border)',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> {t('auth.log_out')}
          </button>
        </div>
      )}
    </div>
  )
}
