'use client'

import Link from 'next/link'
import { Bell, ShoppingCart } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/contexts/auth-context'
import { useMemberNotifications } from '@/app/member/_shared/use-member-notifications'
import { useCart } from '@/app/member/_shared/use-cart'

interface AppTopbarProps {
  /** Portal name shown at the left, e.g. "Member Portal". */
  portalLabel: string
  /** Where the avatar/identity block links to, e.g. "/member/profile". */
  profileHref: string
  /** Shows a real cart icon (with a live item-count badge) next to notifications — member portal only; the admin dashboard has its own separate topbar and never passes this. */
  showCart?: boolean
}

/**
 * Shared topbar for authenticated app areas (admin, member) — portal
 * label, language switch, notifications, and user identity. This is
 * intentionally not the public storefront `MainHeader`: no category
 * dropdown, cart, or favorites icons, since those are irrelevant once a
 * user is inside their own portal. Mirrors the content shape of
 * `app/dashboard/_components/topbar.tsx` (Dialect B) without dashboard's
 * admin-only quick-link row.
 *
 * The unread badge reads this signed-in member's own real notifications
 * (via recipientId, see use-member-notifications.ts) — instead of a
 * hardcoded prop (previously each layout passed its own fabricated
 * `notificationCount` with no connection to the actual list) and instead
 * of the admin dashboard's role-broadcast-only store, which has no
 * concept of "this specific person's" notifications.
 */
export function AppTopbar({ portalLabel, profileHref, showCart = false }: AppTopbarProps) {
  const { user } = useAuth()
  const { data: notifications } = useMemberNotifications(user?.id)
  const notificationCount = notifications.filter((n) => !n.read).length
  const { data: cart } = useCart(showCart ? user?.id : undefined)
  const cartCount = cart.items.length

  return (
    <header
      style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 60,
        flexShrink: 0,
      }}
    >
      <span
        className="cinzel hidden sm:inline"
        style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}
      >
        {portalLabel}
      </span>

      <div className="flex items-center" style={{ gap: 16, marginLeft: 'auto' }}>
        <LanguageSwitcher minimal />

        {showCart && (
          <Link
            href="/member/cart"
            aria-label={cartCount > 0 ? `My Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'My Cart'}
            style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute', top: -4, right: -4, background: 'var(--gold)', color: 'white',
                  width: 16, height: 16, borderRadius: '50%', fontSize: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        )}

        <Link
          href="/member/notifications"
          aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
          style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span
              style={{
                position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: 'white',
                width: 16, height: 16, borderRadius: '50%', fontSize: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}
            >
              {notificationCount}
            </span>
          )}
        </Link>

        <Link
          href={profileHref}
          aria-label="Go to profile"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--purple), var(--teal))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0,
            }}
          >
            {user ? user.firstName[0] : 'G'}
          </div>
          <div className="hidden sm:block">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold)', lineHeight: 1.2 }}>
              {user ? user.roleName : 'Not signed in'}
            </div>
          </div>
        </Link>
      </div>
    </header>
  )
}
