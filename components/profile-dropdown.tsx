"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { User, LayoutDashboard, LogOut, Sun, Moon } from "lucide-react"

/** Where "My Account" goes: staff (admin/manager/staff) to the admin dashboard, everyone else to the member dashboard. */
export function accountHomeFor(role: string | undefined): string {
  return role === "admin" || role === "manager" || role === "staff" ? "/dashboard" : "/member"
}

/**
 * Public-header profile menu. Kept deliberately short: who you are, one
 * "My Account" link into your own dashboard (role-based), the theme toggle
 * and Log Out. The per-role link lists (My Borrowings, My Courses, Manage
 * Users…) were removed — those destinations live inside the dashboards.
 */
export function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push("/")
  }

  const handleIconClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    setOpen(!open)
  }

  const itemCls = "flex items-center gap-3 px-4 py-2.5 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato w-full text-left"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleIconClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isAuthenticated ? t("common.my_account") : t("auth.sign_in")}
        className="flex items-center gap-2 hover:text-w-600 dark:hover:text-amber-400 transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-w-600 text-white dark:text-primary-foreground flex items-center justify-center text-sm font-bold">
          <User size={16} />
        </div>
      </button>

      {open && user && (
        <div role="menu" className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-w-100 dark:border-gray-700">
            <p className="font-cinzel font-semibold text-sm text-w-950 dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-w-600 dark:text-amber-400 mt-0.5">
              {user.roleName}
            </p>
          </div>

          {/* My Account — admin dashboard for staff, member dashboard otherwise */}
          <div className="py-1">
            <Link href={accountHomeFor(user.role)} role="menuitem" onClick={() => setOpen(false)} className={itemCls}>
              <span className="text-w-600 dark:text-amber-400"><LayoutDashboard size={16} /></span>
              {t("common.my_account")}
            </Link>
            <button onClick={toggleTheme} role="menuitem" className={itemCls}>
              <span className="text-w-600 dark:text-amber-400">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </span>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          <div className="border-t border-w-100 dark:border-gray-700" />

          {/* Logout */}
          <div className="py-1">
            <button onClick={handleLogout} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-destructive hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato w-full text-left">
              <span className="text-red-500"><LogOut size={16} /></span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
