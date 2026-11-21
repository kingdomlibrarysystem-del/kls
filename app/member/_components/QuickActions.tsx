"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Bookmark, Clock, Award, Heart, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { DashboardCard } from "./dashboard-card";

/** Shortcuts to the member's most used pages — each goes to its own page. */
export default function QuickActions({ className }: { className?: string }) {
  const { t } = useLanguage();

  const actions = [
    { icon: BookOpen, label: t("m_quick.browse_library"), href: "/member/library", tone: "bg-primary/15 text-[#a07830] dark:text-primary" },
    { icon: GraduationCap, label: t("m_quick.elearning"), href: "/member/e-learning", tone: "bg-[#2a5f8f]/15 text-[#12304a] dark:text-sky-300" },
    { icon: Award, label: t("m_stats.certificates"), href: "/member/certificates", tone: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
    { icon: Clock, label: t("m_quick.my_borrowings"), href: "/member/borrowings", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    { icon: Heart, label: t("m_quick.favorites"), href: "/member/favorites", tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
    { icon: Bookmark, label: t("m_quick.reservations"), href: "/member/reservations", tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <DashboardCard
      className={className}
      icon={<Zap className="size-5" />}
      iconClass="bg-[#12304a] text-primary"
      title={t("m_quick.title")}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {actions.map(({ icon: Icon, label, href, tone }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/60 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
          >
            <span className={`flex size-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${tone}`}>
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-semibold leading-tight text-card-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}
