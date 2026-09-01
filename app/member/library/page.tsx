"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Grid3X3,
  List,
  Info,
  AlertTriangle,
  ScrollText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getRootCategories,
  getChildCategories,
  getCategoryById,
} from "@/lib/kcs-taxonomy";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { useResources } from "@/app/dashboard/library/_components/use-resources";
import { useLanguage } from "@/contexts/language-context";
import { sectionIcons } from "./_components/section-icons";
import { ResourceCard, ResourceListItem } from "./_components/resource-card";
import { ContinueReadingSection } from "./_components/continue-reading-section";
import { ScrollPagination } from "./_components/scroll-pagination";

type SortMode = "newest" | "rating" | "price-asc" | "price-desc";

const PAGE_SIZE = 12;

/** Resources filed directly under this category, or (for a root pillar) under any of its child scrolls too — matches resourceCountFor's own root-includes-children rule. */
function resourcesInSection<T extends { categoryId: string }>(
  sectionId: string,
  resources: T[],
): T[] {
  const isRoot = getRootCategories().some((c) => c.id === sectionId);
  if (!isRoot) return resources.filter((r) => r.categoryId === sectionId);
  const childIds = new Set(getChildCategories(sectionId).map((c) => c.id));
  return resources.filter(
    (r) => r.categoryId === sectionId || childIds.has(r.categoryId),
  );
}

/**
 * Resource-first Kingdom Library: real Resource records are the primary
 * view (search/sort/filter, grid or list), replacing the previous
 * scroll-grouped-by-KCS-section layout — a scroll is still reachable by
 * clicking its section chip (filters resources to that section) or via
 * "Browse the KCS Map" for the pure-taxonomy view with no resource
 * attached yet.
 */
export default function MemberLibraryPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortMode>("newest");
  const [showAbout, setShowAbout] = useState(true);
  const [page, setPage] = useState(1);
  const { loading: categoriesLoading, error: categoriesError } =
    useCategories();
  const {
    data: resources,
    loading: resourcesLoading,
    error: resourcesError,
  } = useResources();

  const loading = categoriesLoading || resourcesLoading;
  const error = categoriesError ?? resourcesError;

  const rootSections = getRootCategories();

  const filtered = useMemo(() => {
    const bySection =
      activeSection === "All"
        ? resources
        : resourcesInSection(activeSection, resources);
    const q = search.trim().toLowerCase();
    const bySearch = q
      ? bySection.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.author.toLowerCase().includes(q) ||
            (getCategoryById(r.categoryId)?.name.en.toLowerCase().includes(q) ??
              false),
        )
      : bySection;
    const visible = bySearch.filter((r) => r.status !== "archived");
    const sorted = [...visible];
    if (sort === "rating") sorted.sort((a, b) => b.avgRating - a.avgRating);
    else if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [resources, activeSection, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        aria-label="Loading Kingdom Library"
      >
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 300, borderRadius: 8 }} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load the Kingdom Library"
        description={error}
        style={{ color: "var(--text-secondary)" }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "'Cinzel',serif",
            }}
          >
            Kingdom Library
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            {resources.length} {t("m_library.resources")} {t("m_library.across")} {rootSections.length} {t("m_library.sections")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setShowAbout(!showAbout)}
            aria-label="About the Kingdom Classification System"
            style={{
              padding: "6px 8px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              background: showAbout ? "rgba(212,168,67,0.15)" : "transparent",
              color: showAbout ? "var(--gold)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
            }}
          >
            <Info size={14} /> About KCS
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            style={{
              padding: "6px 8px",
              background:
                view === "grid" ? "rgba(212,168,67,0.15)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              color: view === "grid" ? "var(--gold)" : "var(--text-muted)",
            }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            style={{
              padding: "6px 8px",
              background:
                view === "list" ? "rgba(212,168,67,0.15)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              color: view === "list" ? "var(--gold)" : "var(--text-muted)",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showAbout && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--gold)",
              marginBottom: 6,
              fontFamily: "'Cinzel',serif",
            }}
          >
            Kingdom Classification System (KCS)
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            The KCS organizes Scripture according to divine pattern:{" "}
            <strong>
              Foundation → History → Wisdom → Prophetic → Gospels → Acts →
              Epistles → Revelation
            </strong>
            . Click a section below to see the resources filed under it.
          </div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          placeholder={t("m_library.search_placeholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label={t("m_library.search_placeholder")}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-input, var(--bg-card))",
            color: "var(--text-primary)",
            fontSize: 15,
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setActiveSection("All");
              setPage(1);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background:
                activeSection === "All" ? "var(--gold)" : "transparent",
              color: activeSection === "All" ? "#fff" : "var(--text-secondary)",
            }}
          >
            All Sections
          </button>
          {rootSections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                setPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                background:
                  activeSection === s.id ? "var(--gold)" : "transparent",
                color:
                  activeSection === s.id ? "#fff" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              <span style={{ display: "flex" }}>{sectionIcons[s.id]}</span>
              <span>{s.code}</span>
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortMode);
            setPage(1);
          }}
          aria-label="Sort resources"
          style={{
            padding: "7px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            fontSize: 12,
          }}
        >
          <option value="newest">Newest First</option>
          <option value="rating">Highest Rated</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <ContinueReadingSection />

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No resources found"
          description={
            search
              ? `No resources match "${search}".`
              : "No resources are filed under this section yet."
          }
          style={{ color: "var(--text-secondary)" }}
        />
      ) : (
        <>
          {view === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {paged.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {paged.map((r) => (
                <ResourceListItem key={r.id} resource={r} />
              ))}
            </div>
          )}
          <ScrollPagination page={currentPage} totalPages={pageCount} onPage={goToPage} />
        </>
      )}
    </div>
  );
}
