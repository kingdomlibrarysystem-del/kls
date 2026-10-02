"use client"

import { useRef, useState, useEffect } from "react"
import { useLanguage, type Lang } from "@/contexts/language-context"

/** `short` is what the header button shows (ENG / FRA / KINY); the dropdown lists the full `label`. */
const languages: { code: Lang; label: string; short: string; flag: string }[] = [
  { code: "en", label: "English", short: "ENG", flag: "🇬🇧" },
  { code: "fr", label: "Français", short: "FRA", flag: "🇫🇷" },
  { code: "rw", label: "Kinyarwanda", short: "KINY", flag: "🇷🇼" },
]

export function LanguageSwitcher({ minimal = false }: { minimal?: boolean }) {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const current = languages.find((l) => l.code === lang) ?? languages[0]

  const dropdown = (
    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => { setLang(l.code); setOpen(false) }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition font-lato hover:bg-w-100 dark:hover:bg-gray-700/50 ${
            lang === l.code ? "text-w-950 dark:text-white font-semibold" : "text-w-700 dark:text-gray-300"
          }`}
        >
          <span className="text-base">{l.flag}</span>
          <span>{l.label}</span>
          {lang === l.code && <span className="ml-auto text-w-600 dark:text-amber-400 text-xs">✓</span>}
        </button>
      ))}
    </div>
  )

  if (minimal) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Language: ${current.label}`}
          className="flex items-center gap-1.5 text-w-600 dark:text-amber-400 hover:text-w-700 dark:hover:text-amber-300 transition cursor-pointer"
        >
          <span key={lang} className="text-xs font-bold tracking-wide animate-in fade-in duration-200">{current.short}</span>
        </button>
        {open && dropdown}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 cursor-pointer">
        <span className="text-base">{current.flag}</span>
        <span key={`${lang}-label`} className="text-xs font-bold tracking-wide text-w-700 dark:text-gray-300 animate-in fade-in duration-200">{current.short}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" className="text-w-600 dark:text-amber-400" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      {open && dropdown}
    </div>
  )
}
