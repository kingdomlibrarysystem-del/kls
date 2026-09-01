"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"

import {
  User,
  BookOpen,
  GraduationCap,
  Heart,
  Settings,
  Bell,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"

/**
 * Real member-side destinations only — the previous `/e-learning`,
 * `/profile`, `/notifications` root paths never resolved to a page (only
 * `/dashboard/*` and `/member/*` variants exist). "Favorite Articles" was
 * dropped: no articles/blog feature exists anywhere in the data model, so
 * there was no real destination to wire it to — `/member/favorites`
 * (the real favorited-scrolls/resources list) replaces it as an honest
 * equivalent instead.
 */
const menuLinksByRole: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  member: [
    { label: "My Borrowings", href: "/member/borrowings", icon: <BookOpen size={16} /> },
    { label: "My Courses", href: "/member/courses", icon: <GraduationCap size={16} /> },
    { label: "Favorites", href: "/member/favorites", icon: <Heart size={16} /> },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: <BookOpen size={16} /> },
    { label: "Manage Users", href: "/dashboard/users", icon: <User size={16} /> },
    { label: "Audit Log", href: "/dashboard/audit-log", icon: <Bell size={16} /> },
  ],
  manager: [
    { label: "Dashboard", href: "/dashboard", icon: <BookOpen size={16} /> },
    { label: "Manage Users", href: "/dashboard/users", icon: <User size={16} /> },
  ],
  staff: [
    { label: "Dashboard", href: "/dashboard", icon: <BookOpen size={16} /> },
  ],
}

const bottomLinksByRole: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  member: [
    { label: "My Profile", href: "/member/profile", icon: <User size={16} /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={16} /> },
    { label: "Settings", href: "/member/profile", icon: <Settings size={16} /> },
  ],
  admin: [
    { label: "My Profile", href: "/member/profile", icon: <User size={16} /> },
    { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={16} /> },
    { label: "Settings", href: "/member/profile", icon: <Settings size={16} /> },
  ],
  manager: [
    { label: "My Profile", href: "/member/profile", icon: <User size={16} /> },
    { label: "Settings", href: "/member/profile", icon: <Settings size={16} /> },
  ],
  staff: [
    { label: "My Profile", href: "/member/profile", icon: <User size={16} /> },
    { label: "Settings", href: "/member/profile", icon: <Settings size={16} /> },
  ],
}

export function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
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

  const role = user?.roleName?.toLowerCase() ?? "member"
  const menuLinks = menuLinksByRole[role] ?? menuLinksByRole.member
  const bottomLinks = bottomLinksByRole[role] ?? bottomLinksByRole.member

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleIconClick}
        className="flex items-center gap-2 hover:text-w-600 dark:hover:text-amber-400 transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-w-600 text-white flex items-center justify-center text-sm font-bold">
          <User size={16} />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-w-100 dark:border-gray-700">
            <p className="font-cinzel font-semibold text-sm text-w-950 dark:text-white">
              {user!.firstName} {user!.lastName}
            </p>
            <p className="text-xs text-w-600 dark:text-amber-400 mt-0.5">
              {user!.roleName}
            </p>
          </div>

          {/* Menu links — role-based */}
          <div className="py-1">
            {menuLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato"
              >
                <span className="text-w-600 dark:text-amber-400">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-w-100 dark:border-gray-700" />

          {/* Account links — role-based */}
          <div className="py-1">
            {bottomLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato"
              >
                <span className="text-w-600 dark:text-amber-400">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Appearance */}
          <div className="py-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato w-full text-left"
            >
              <span className="text-w-600 dark:text-amber-400">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </span>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-w-100 dark:border-gray-700" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato w-full text-left"
            >
              <span className="text-red-500">
                <LogOut size={16} />
              </span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
