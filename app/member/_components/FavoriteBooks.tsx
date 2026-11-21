"use client";

import Link from "next/link";
import { Heart, GraduationCap, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useFavorites } from "@/app/member/_shared/use-favorites";
import { DashboardCard, DashboardEmpty } from "./dashboard-card";

/** Dashboard-home widget for favorited items, reading from the shared favorites store — the same one the library page's heart toggle and the Favorites page's Remove action write to. */
export default function FavoriteBooks({ className }: { className?: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const favorites = useFavorites(user?.id);

  return (
    <DashboardCard
      className={className}
      icon={<Heart className="size-5" />}
      iconClass="bg-rose-500/12 text-rose-600 dark:text-rose-400"
      title={t("m_fav_widget.title")}
      meta={favorites.length || undefined}
      footerHref={favorites.length ? "/member/favorites" : "/member/library"}
      footerLabel={favorites.length ? t("m_fav_widget.view_all") : t("m_fav_widget.browse_library")}
    >
      {favorites.length === 0 ? (
        <DashboardEmpty icon={<Heart className="size-7" />} text={t("m_fav_widget.no_favorites")} />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {favorites.slice(0, 4).map((f) => {
            const Icon = f.type === "COURSE" ? GraduationCap : BookOpen;
            return (
              <li key={f.id}>
                <Link
                  href={f.type === "COURSE" ? `/member/courses/${f.id}` : `/library/${f.id}`}
                  className="group flex items-center gap-3 py-3 first:pt-0"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-rose-500">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-card-foreground group-hover:text-[#12304a] dark:group-hover:text-primary">{f.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{f.subtitle}</span>
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
