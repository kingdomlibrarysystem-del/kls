"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"

import {
  User,
  BookOpen,
  GraduationCap,
  Heart,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react"

const menuLinks = [
  {
    label: "My Books",
    href: "/library",
    icon: <BookOpen size={16} />,
  },
  {
    label: "Courses",
    href: "/e-learning",
    icon: <GraduationCap size={16} />,
  },
  {
    label: "Favorite Articles",
    href: "#",
    icon: <Heart size={16} />,
  },
]

const bottomLinks = [
  {
    label: "My Profile",
    href: "/profile",
    icon: <User size={16} />,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell size={16} />,
  },
  {
    label: "Settings",
    href: "/profile",
    icon: <Settings size={16} />,
  },
  {
    label: "Help & Support",
    href: "#",
    icon: <HelpCircle size={16} />,
  },
]

export function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
          {/* User info */}
          <div className="px-4 py-3 border-b border-w-100 dark:border-gray-700">
            <p className="font-cinzel font-semibold text-sm text-w-950 dark:text-white">
              Guest User
            </p>
            <p className="text-xs text-w-600 dark:text-amber-400 mt-0.5">
              Sign in to access features
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

          {/* Auth links */}
          <div className="py-1">
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
          </div>
        </div>
      )}
    </div>
  )
}
