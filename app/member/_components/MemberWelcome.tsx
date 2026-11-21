"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { BookOpen, GraduationCap, User } from "lucide-react";

/** Navy welcome banner at the top of the member dashboard — same navy + gold as the home hero, in both themes. */
export default function MemberWelcome() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const today = new Date().toLocaleDateString(lang === "rw" ? "rw-RW" : lang === "fr" ? "fr-FR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "K";

  return (
    <section className="kls-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3d5c] via-[#12304a] to-[#0b2136] p-6 text-[#f6efe0] shadow-lg sm:p-8">
      {/* Soft gold and blue glows, and a faint open book on the right. */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-[#2a5f8f]/40 blur-3xl" />
      <BookOpen aria-hidden className="pointer-events-none absolute -right-6 bottom-[-28px] hidden size-56 text-white/[0.05] md:block" strokeWidth={1} />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div className="hidden size-16 shrink-0 items-center justify-center rounded-2xl border border-primary/40 sm:flex bg-white/5 font-cinzel text-2xl font-bold text-primary shadow-inner">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p suppressHydrationWarning className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{today}</p>
          <h1 className="mt-1 font-cinzel text-2xl font-bold leading-tight sm:text-3xl">
            {t("m_welcome.welcome_back")} {user?.firstName || t("m_welcome.guest")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#f6efe0]/75 sm:text-base">{t("m_welcome.explore_desc")}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/member/library"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#0b2136] shadow-md transition hover:bg-primary/90"
            >
              <BookOpen className="size-4" /> {t("m_welcome.browse_library")}
            </Link>
            <Link
              href="/member/e-learning"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#f6efe0]/30 bg-white/5 px-5 text-sm font-semibold text-[#f6efe0] transition hover:bg-white/10"
            >
              <GraduationCap className="size-4" /> {t("m_welcome.go_elearning")}
            </Link>
            <Link
              href="/member/profile"
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#f6efe0]/80 transition hover:bg-white/10 hover:text-[#f6efe0]"
            >
              <User className="size-4" /> {t("m_profile.title")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
