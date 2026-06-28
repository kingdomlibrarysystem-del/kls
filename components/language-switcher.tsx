"use client"

import { useEffect, useRef, useState } from "react"
import { Languages } from "lucide-react"

declare global {
  interface Window {
    googleTranslateElementInit: () => void
    google: {
      translate: {
        TranslateElement: {
          new (config: {
            pageLanguage: string
            includedLanguages: string
            layout: number
            autoDisplay: boolean
          }, elementId: string): void
          InlineLayout: { SIMPLE: number }
        }
      }
    }
  }
}

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
]

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getCurrentLang(): string {
  const gt = getCookie("googtrans")
  if (gt) {
    const parts = gt.split("/")
    return parts[parts.length - 1] || "en"
  }
  return "en"
}

function switchLanguage(lang: string) {
  document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000; SameSite=Lax`

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (select) {
    select.value = lang
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  if (typeof window !== "undefined") {
    setTimeout(() => window.location.reload(), 100)
  }
}

export function LanguageSwitcher({ minimal = false }: { minimal?: boolean }) {
  const initialized = useRef(false)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState("en")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrent(getCurrentLang())

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    const observer = new MutationObserver(() => {
      const el = document.getElementById("goog-gt-tt")
      if (el) el.style.display = "none"
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (document.getElementById("google-translate-script")) return

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,fr,rw",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      )
    }

    const script = document.createElement("script")
    script.id = "google-translate-script"
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    script.async = true
    document.body.appendChild(script)
  }, [])

  const currentLang = languages.find((l) => l.code === current) || languages[0]

  if (minimal) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-w-600 dark:text-amber-400 hover:text-w-700 dark:hover:text-amber-300 transition cursor-pointer"
        >
          <Languages size={16} />
          <span className="text-xs font-semibold hidden sm:inline">
            {currentLang.label}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden text-sm">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  switchLanguage(lang.code)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition font-lato hover:bg-w-100 dark:hover:bg-gray-700/50 ${
                  current === lang.code
                    ? "text-w-950 dark:text-white font-semibold"
                    : "text-w-700 dark:text-gray-300"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {current === lang.code && (
                  <span className="ml-auto text-w-600 dark:text-amber-400 text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div id="google_translate_element" className="hidden" />
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <Languages size={16} className="text-w-600 dark:text-amber-400" />
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 cursor-pointer"
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="text-xs font-semibold text-w-700 dark:text-gray-300">
          {currentLang.label}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          className="text-w-600 dark:text-amber-400"
          fill="none"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden text-sm">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                switchLanguage(lang.code)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition font-lato hover:bg-w-100 dark:hover:bg-gray-700/50 ${
                current === lang.code
                  ? "text-w-950 dark:text-white font-semibold"
                  : "text-w-700 dark:text-gray-300"
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {current === lang.code && (
                <span className="ml-auto text-w-600 dark:text-amber-400 text-xs">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div id="google_translate_element" className="hidden" />
    </div>
  )
}
