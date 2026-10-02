"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Award,
  ChevronDown,
  Library,
  Menu,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import { ProfileDropdown } from "./profile-dropdown";
import { LanguageSwitcher } from "./language-switcher";
import { DailyWisdom } from "@/components/home/daily-wisdom";
import { useLanguage } from "@/contexts/language-context";

/**
 * Public site header (sticky):
 *  1. verse bar — the Bible verse that used to float over the hero, now a
 *     full-width strip at the very top with its own background;
 *  2. main bar — logo, Browse Library, search, Daily Wisdom, language, profile;
 *  3. navigation — hover/focus dropdowns on md+ screens, and a hamburger
 *     menu on phones listing the same sections (Library, E-Learning, News…),
 *     which were previously hidden on mobile.
 */
export function MainHeader() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    router.push(
      query.trim()
        ? `/library?q=${encodeURIComponent(query.trim())}`
        : "/library",
    );
  };

  const navSections = [
    {
      title: t("nav.library"),
      items: [
        { label: t("nav.browse_books"), href: "/library", icon: <BookOpen size={14} /> },
        { label: t("nav.my_borrowings"), href: "/member/borrowings", icon: <Bookmark size={14} /> },
        { label: t("nav.reservations"), href: "/member/reservations", icon: <CalendarDays size={14} /> },
      ],
    },
    {
      title: t("nav.e_learning"),
      items: [
        { label: t("nav.browse_courses"), href: "/member/e-learning", icon: <Library size={14} /> },
        { label: t("nav.my_courses"), href: "/member/courses", icon: <CheckSquare size={14} /> },
        { label: t("nav.assessments"), href: "/member/assessments", icon: <ClipboardList size={14} /> },
        { label: t("nav.certificates"), href: "/member/certificates", icon: <Award size={14} /> },
      ],
    },
    {
      title: t("nav.news"),
      items: [
        { label: t("nav.latest_news"), href: "/news", icon: <Newspaper size={14} /> },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* 1. Verse bar */}
      <div className="bg-[#2c2416] text-[#f0e8d5] dark:bg-[#161e30]">
        <div
          key={`${lang}-verse`}
          className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 text-center animate-in fade-in duration-200"
        >
          <p className="min-w-0 truncate font-cormorant text-sm italic leading-snug md:whitespace-normal">
            {t("hero.bible_verse")}
          </p>
          <span className="shrink-0 font-cinzel text-[11px] not-italic tracking-widest text-[#c9a96e]">
            {t("hero.bible_ref")}
          </span>
        </div>
      </div>

      {/* 2. Main bar */}
      <div className="bg-white dark:bg-[#0a0d1a] shadow-md py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-6 md:mb-4">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="flex size-10 shrink-0 items-center justify-center rounded border border-w-300 text-w-950 transition hover:bg-w-100 md:hidden dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/kls-logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full w-10 h-10"
              />
              <h1
                key={`${lang}-brand`}
                className="font-cinzel text-lg font-bold text-w-950 dark:text-white hidden sm:block animate-in fade-in duration-200"
                style={{ letterSpacing: "1px" }}
              >
                {t("common.app_name")}
              </h1>
            </Link>

            <Link
              href="/library"
              className="hidden md:flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 font-lato text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/85"
            >
              <BookOpen size={16} />
              <span>{t("nav.browse_library")}</span>
            </Link>

            <form onSubmit={handleSearch} role="search" className="relative flex-1 min-w-0">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-w-600 dark:text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                aria-label={t("header.search_placeholder")}
                className="h-10 w-full rounded-full border border-w-300 bg-w-50 pl-10 pr-4 font-lato text-sm transition focus:border-w-600 focus:bg-white focus:outline-none focus:ring-3 focus:ring-primary/25 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </form>

            <DailyWisdom />

            <div className="flex items-center gap-3 md:gap-4">
              <LanguageSwitcher minimal />
              <ProfileDropdown />
            </div>
          </div>

          {/* 3a. Desktop navigation */}
          <nav className="hidden md:flex flex-wrap gap-2 border-t border-w-200 dark:border-gray-700 pt-3">
            <div key={`${lang}-nav`} className="flex gap-2 items-center flex-1 animate-in fade-in duration-200">
              {navSections.map((section) => (
                <div key={section.title} className="relative group">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    className="px-4 py-2 text-w-950 dark:text-gray-200 hover:text-w-600 dark:hover:text-amber-400 transition font-lato text-sm font-semibold flex items-center gap-1"
                  >
                    <span className="flex items-center gap-1.5">{section.title}</span>
                    <ChevronDown size={12} />
                  </button>

                  <div className="absolute left-0 mt-0 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 min-w-max">
                    {section.items.map((item) => (
                      <Link
                        key={`${section.title}-${item.label}`}
                        href={item.href}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-w-950 dark:text-gray-200 hover:bg-w-100 dark:hover:bg-gray-700 border-b border-w-100 dark:border-gray-700 last:border-0 font-lato"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* 3b. Mobile navigation (hamburger) — same sections as desktop */}
          {menuOpen && (
            <nav
              id="mobile-nav"
              key={`${lang}-mobile-nav`}
              className="md:hidden mt-3 max-h-[70vh] overflow-y-auto border-t border-w-200 pt-3 pb-2 animate-in fade-in slide-in-from-top-1 duration-150 dark:border-gray-700"
            >
              <Link
                href="/library"
                onClick={() => setMenuOpen(false)}
                className="mb-3 flex items-center justify-center gap-2 rounded bg-w-950 px-4 py-2.5 font-lato text-sm font-semibold text-white transition hover:bg-w-900 dark:text-primary-foreground"
              >
                <BookOpen size={16} />
                {t("nav.browse_library")}
              </Link>

              {navSections.map((section) => (
                <div key={section.title} className="mb-2">
                  <p className="px-2 pb-1 font-cinzel text-xs font-bold uppercase tracking-widest text-w-600 dark:text-amber-400">
                    {section.title}
                  </p>
                  <ul>
                    {section.items.map((item) => (
                      <li key={`${section.title}-${item.label}`}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded px-2 py-2.5 font-lato text-sm text-w-950 transition hover:bg-w-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <span className="text-w-600 dark:text-amber-400">{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
