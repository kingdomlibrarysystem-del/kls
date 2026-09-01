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
} from "lucide-react";
import { ProfileDropdown } from "./profile-dropdown";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/contexts/language-context";

export function MainHeader() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
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
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white dark:bg-[#0a0d1a] shadow-md py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-4">
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
              className="hidden md:flex px-4 py-2 bg-w-100 dark:bg-gray-800 text-w-950 dark:text-white rounded items-center gap-2 hover:bg-w-200 dark:hover:bg-gray-700 transition font-lato font-semibold"
            >
              <span>{t("nav.browse_library")}</span>
              <ChevronDown size={14} />
            </Link>

            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                aria-label={t("header.search_placeholder")}
                className="w-full px-4 py-2 border border-w-300 dark:border-gray-600 rounded font-lato text-sm focus:outline-none focus:border-w-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </form>

            <div className="flex items-center gap-4">
              <LanguageSwitcher minimal />
              <ProfileDropdown />
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-t border-w-200 dark:border-gray-700 pt-3">
            <Link
              href="/library"
              className="px-4 py-2 bg-w-950 text-white rounded flex items-center gap-2 hover:bg-w-900 transition text-sm font-lato font-semibold md:hidden"
            >
              <Menu size={16} />
              {t("nav.browse_library")}
              <ChevronDown size={14} />
            </Link>

            <div key={`${lang}-nav`} className="hidden md:flex gap-2 items-center flex-1 animate-in fade-in duration-200">
              {navSections.map((section) => (
                <div key={section.title} className="relative group">
                  <button className="px-4 py-2 text-w-950 dark:text-gray-200 hover:text-w-600 dark:hover:text-amber-400 transition font-lato text-sm font-semibold flex items-center gap-1">
                    <span className="flex items-center gap-1.5">{section.title}</span>
                    <ChevronDown size={12} />
                  </button>

                  <div className="absolute left-0 mt-0 bg-white dark:bg-[#161e30] border border-w-200 dark:border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
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
        </div>
      </div>
    </header>
  );
}
