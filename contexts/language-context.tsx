"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import en from "@/locales/en.json"
import fr from "@/locales/fr.json"
import rw from "@/locales/rw.json"

export type Lang = "en" | "fr" | "rw"

export const LANG_COOKIE = "kls_lang"

const dictionaries = { en, fr, rw } as const

type DeepValue<T> = T extends string ? string : { [K in keyof T]: DeepValue<T[K]> }
type Dict = typeof en

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj) as string ?? path
}

export function isLang(value: string | undefined | null): value is Lang {
  return value === "en" || value === "fr" || value === "rw"
}

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: ReactNode
  initialLang?: Lang
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: (next) => {
          if (next === lang) return
          document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
          document.documentElement.lang = next
          setLangState(next)
        },
        t: (key) => getNestedValue(dictionaries[lang] as unknown as Record<string, unknown>, key),
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
