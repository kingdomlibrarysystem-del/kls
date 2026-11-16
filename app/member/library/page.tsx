"use client";
import { useState, useMemo } from "react";
import { Search, Grid3X3, List, AlertTriangle, ScrollText, BookOpenCheck, Headphones, PlayCircle, LibraryBig, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getRootCategories, getChildCategories, getCategoryById } from "@/lib/kcs-taxonomy";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { useResources } from "@/app/dashboard/library/_components/use-resources";
import { isResourceReadable } from "@/app/dashboard/library/_components/resources-data";
import { playableKind } from "@/lib/media-embed";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { sectionIcons } from "./_components/section-icons";
import { ResourceCard, ResourceListItem } from "./_components/resource-card";
import { ContinueReadingSection } from "./_components/continue-reading-section";
import { ScrollPagination } from "./_components/scroll-pagination";

type SortMode = "newest" | "rating" | "price-asc" | "price-desc";
/** What the member wants to do with a title: read it, listen to it or watch it. */
type KindFilter = "all" | "read" | "listen" | "watch";

const PAGE_SIZE = 12;

/** Resources filed directly under this category, or (for a root pillar) under any of its child scrolls too — matches resourceCountFor's own root-includes-children rule. */
function resourcesInSection<T extends { categoryId: string }>(sectionId: string, resources: T[]): T[] {
  const isRoot = getRootCategories().some((c) => c.id === sectionId);
  if (!isRoot) return resources.filter((r) => r.categoryId === sectionId);
  const childIds = new Set(getChildCategories(sectionId).map((c) => c.id));
  return resources.filter((r) => r.categoryId === sectionId || childIds.has(r.categoryId));
}

const chip = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
    active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
  );

/**
 * Member Kingdom Library, built to be easy: GRID by default (book-shaped
 * covers, one big Read / Listen / Watch button per book), list as the
 * alternate. Search, "what do you want to do" (All / Read / Listen / Watch),
 * sections by NAME (not internal codes), and sort. Resources come from the
 * same store the admin Book Inventory manages.
 */
export default function MemberLibraryPage() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [kind, setKind] = useState<KindFilter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const { loading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useResources();

  const loading = categoriesLoading || resourcesLoading;
  const error = categoriesError ?? resourcesError;
  const rootSections = getRootCategories();
  const sectionName = (s: { name: { en: string; fr: string; rw: string } }) => s.name[lang as "en" | "fr" | "rw"] || s.name.en;

  const filtered = useMemo(() => {
    const bySection = activeSection === "All" ? resources : resourcesInSection(activeSection, resources);
    const q = search.trim().toLowerCase();
    const bySearch = q
      ? bySection.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.author.toLowerCase().includes(q) ||
            (getCategoryById(r.categoryId)?.name.en.toLowerCase().includes(q) ?? false),
        )
      : bySection;
    const byKind = bySearch.filter((r) => {
      if (kind === "all") return true;
      const media = playableKind(r);
      if (kind === "listen") return media === "audio";
      if (kind === "watch") return media === "video";
      return !media && isResourceReadable(r);
    });
    const visible = byKind.filter((r) => r.status !== "archived");
    const sorted = [...visible];
    if (sort === "rating") sorted.sort((a, b) => b.avgRating - a.avgRating);
    else if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [resources, activeSection, search, sort, kind]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const filtersOn = !!search || activeSection !== "All" || kind !== "all";
  const clearFilters = () => {
    setSearch("");
    setActiveSection("All");
    setKind("all");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-label="Loading Kingdom Library">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[3/5] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the Kingdom Library" description={error} style={{ color: "var(--text-secondary)" }} />;
  }

  const kinds: { key: KindFilter; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: t("m_library.type_all"), icon: <LibraryBig className="size-4" /> },
    { key: "read", label: t("m_library.read"), icon: <BookOpenCheck className="size-4" /> },
    { key: "listen", label: t("m_library.listen"), icon: <Headphones className="size-4" /> },
    { key: "watch", label: t("m_library.watch"), icon: <PlayCircle className="size-4" /> },
  ];
  const viewBtn = (v: "grid" | "list") =>
    cn("flex size-9 items-center justify-center rounded-lg border transition-colors", view === v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground");

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-foreground">Kingdom Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("m_library.subtitle").replace("{n}", String(resources.length))}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={viewBtn("grid")}><Grid3X3 size={17} /></button>
          <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={viewBtn("list")}><List size={17} /></button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder={t("m_library.search_placeholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label={t("m_library.search_placeholder")}
            className="h-12 w-full rounded-lg border border-input bg-background pl-11 pr-10 text-base text-foreground outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search" className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("m_library.type_all")}>
            {kinds.map((k) => (
              <button key={k.key} type="button" onClick={() => { setKind(k.key); setPage(1); }} aria-pressed={kind === k.key} className={chip(kind === k.key)}>
                {k.icon} {k.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortMode); setPage(1); }}
            aria-label="Sort resources"
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="newest">{t("m_library.sort_newest")}</option>
            <option value="rating">{t("m_library.sort_rating")}</option>
            <option value="price-asc">{t("m_library.sort_price_low")}</option>
            <option value="price-desc">{t("m_library.sort_price_high")}</option>
          </select>
        </div>

        {rootSections.length > 0 && (
          // Sections by name; scrolls sideways on phones instead of wrapping into many rows.
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button type="button" onClick={() => { setActiveSection("All"); setPage(1); }} className={chip(activeSection === "All")}>
              {t("m_library.all_sections")}
            </button>
            {rootSections.map((s) => (
              <button key={s.id} type="button" onClick={() => { setActiveSection(s.id); setPage(1); }} className={chip(activeSection === s.id)} title={s.code}>
                <span className="flex">{sectionIcons[s.id]}</span>
                {sectionName(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      <ContinueReadingSection />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <ScrollText className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold text-foreground">{t("m_library.no_results_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{search ? t("m_library.no_results_search").replace("{q}", search) : t("m_library.no_results_filter")}</p>
          {filtersOn && (
            <button type="button" onClick={clearFilters} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted">
              <X size={14} /> {t("m_library.clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("m_library.showing").replace("{n}", String(filtered.length))}</p>
          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {paged.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {paged.map((r) => <ResourceListItem key={r.id} resource={r} />)}
            </div>
          )}
          <ScrollPagination page={currentPage} totalPages={pageCount} onPage={goToPage} />
        </>
      )}
    </div>
  );
}
