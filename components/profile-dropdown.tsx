"use client"

import { useState, useRef, useEffect } from "react"
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
  ChevronDown,
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
const menuLinks = [
  {
    label: "My Borrowings",
    href: "/member/borrowings",
    icon: <BookOpen size={16} />,
  },
  {
    label: "My Courses",
    href: "/member/courses",
    icon: <GraduationCap size={16} />,
  },
  {
    label: "Favorites",
    href: "/member/favorites",
    icon: <Heart size={16} />,
  },
]

const bottomLinks = [
  {
    label: "My Profile",
    href: "/member/profile",
    icon: <User size={16} />,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: <Bell size={16} />,
  },
  {
    label: "Settings",
    href: "/member/profile",
    icon: <Settings size={16} />,
  },
]

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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:text-w-600 dark:hover:text-amber-400 transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-w-600 text-white flex items-center justify-center text-sm font-bold">
          <User size={16} />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info — reflects real auth state, not a permanent "Guest" placeholder */}
          <div className="px-4 py-3 border-b border-w-100 dark:border-gray-700">
            <p className="font-cinzel font-semibold text-sm text-w-950 dark:text-white">
              {isAuthenticated && user ? `${user.firstName} ${user.lastName}` : "Guest User"}
            </p>
            <p className="text-xs text-w-600 dark:text-amber-400 mt-0.5">
              {isAuthenticated && user ? user.roleName : "Sign in to access features"}
            </p>
          </div>

          {/* Menu links */}
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

          {/* Account links */}
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

          {/* Auth links — real logout when signed in, Login/Register when not */}
          <div className="py-1">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato w-full text-left"
              >
                <span className="text-red-500">
                  <LogOut size={16} />
                </span>
                Log Out
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-w-100 dark:hover:bg-gray-700/50 transition font-lato"
              >
                <span className="text-red-500">
                  <LogOut size={16} />
                </span>
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
