"use client";

import Link from "next/link";
import { BookMarked, CalendarClock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";
import { DashboardCard, DashboardEmpty } from "./dashboard-card";

/** Dashboard-home widget for active borrowings, reading from the real /api/borrowings-backed hook. */
export default function BorrowedBooks({ className }: { className?: string }) {
  const { data: borrowings } = useBorrowings();
  const { t } = useLanguage();
  const active = borrowings.filter((b) => b.status === "active" || b.status === "overdue" || b.status === "pending");

  return (
    <DashboardCard
      className={className}
      icon={<BookMarked className="size-5" />}
      iconClass="bg-amber-500/15 text-amber-700 dark:text-amber-400"
      title={t("m_borrowed.currently_borrowed")}
      meta={`${active.length} ${t("m_borrowed.items")}`}
      footerHref="/member/borrowings"
      footerLabel={t("m_borrowed.view_all")}
    >
      {active.length === 0 ? (
        <DashboardEmpty icon={<BookMarked className="size-7" />} text={t("m_borrowed.no_books")} href="/member/library" linkLabel={t("m_borrowed.browse_library")} />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {active.slice(0, 4).map((b) => {
            const status =
              b.status === "pending"
                ? { label: t("common.pending"), cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" }
                : b.status === "overdue"
                  ? { label: t("common.overdue"), cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" }
                  : { label: t("common.active"), cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
            return (
              <li key={b.id}>
                <Link href={`/member/borrowings/${b.id}`} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-card-foreground hover:text-[#12304a] dark:hover:text-primary">{b.resourceTitle}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" /> {t("m_borrowed.due")} {b.dueDate}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
