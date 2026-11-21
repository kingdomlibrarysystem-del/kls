"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useResources } from "@/app/dashboard/library/_components/use-resources";
import { useReadingProgress, getReadingProgressPercent } from "@/app/member/_shared/use-reading-progress";
import { LinkPendingIcon } from "@/components/reader/link-pending-icon";
import { RemoteImage } from "@/components/ui/remote-image";
import { DashboardCard, DashboardEmpty } from "./dashboard-card";

/**
 * Dashboard-home "Currently Reading" widget: the books the member has
 * started, with their cover and real progress, derived from the same
 * useReadingProgress()/useResources() stores the reader and
 * /member/library's Continue Reading section read. Each row opens the
 * reader where the member left off.
 */
export default function CurrentlyReading({ className }: { className?: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: resources } = useResources();
  const progress = useReadingProgress(user?.id);

  const rows = progress
    .filter((p) => p.status === "READING")
    .map((p) => ({ entry: p, resource: resources.find((r) => r.id === p.resourceId) }))
    .filter((r): r is { entry: typeof progress[number]; resource: NonNullable<typeof r.resource> } => !!r.resource);

  return (
    <DashboardCard
      className={className}
      icon={<BookOpen className="size-5" />}
      iconClass="bg-primary/15 text-[#a07830] dark:text-primary"
      title={t("m_reading.currently_reading")}
      meta={`${rows.length} ${rows.length === 1 ? t("m_reading.book") : t("m_reading.books")}`}
      footerHref="/member/library"
      footerLabel={t("m_reading.go_kingdom_library")}
    >
      {rows.length === 0 ? (
        <DashboardEmpty icon={<BookOpen className="size-7" />} text={t("m_reading.not_reading")} href="/member/library" linkLabel={t("m_reading.browse_library")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.slice(0, 4).map(({ entry, resource }) => {
            const percent = getReadingProgressPercent(entry);
            return (
              <li key={resource.id}>
                <Link
                  href={`/member/library/read/${resource.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-background/60 p-3 transition hover:border-primary/50 hover:bg-muted/50"
                >
                  <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-[#1a3d5c] to-[#0b2136] shadow-md">
                    <RemoteImage
                      src={resource.coverImages[0]}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      fallback={<BookOpen className="absolute inset-0 m-auto size-5 text-primary" />}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold text-card-foreground">{resource.title}</span>
                    {resource.author && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{resource.author}</span>}
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">{percent}%</span>
                    </span>
                  </span>
                  <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">
                    <LinkPendingIcon icon={<ChevronRight className="size-4" />} size={16} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
