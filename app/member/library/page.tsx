"use client";
import { useState } from "react";
import { Search, Grid3X3, List, Feather, Info, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getRootCategories, getChildCategories } from "@/lib/kcs-taxonomy";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { sectionIcons } from "./_components/section-icons";
import { ScrollCard, ScrollListItem } from "./_components/scroll-card";
import { ScrollPagination } from "./_components/scroll-pagination";
import { WriteScrollModal } from "./_components/write-scroll-modal";
import { ContinueReadingSection } from "./_components/continue-reading-section";

/** Scrolls shown per section per page — keeps a 19-scroll section (History) from rendering an unbounded grid. */
const PAGE_SIZE = 12;

export default function MemberLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAbout, setShowAbout] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [pageBySection, setPageBySection] = useState<Record<string, number>>({});
  const { loading, error } = useCategories();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-label="Loading Kingdom Library">
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 300, borderRadius: 8 }} />
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the Kingdom Library" description={error} style={{ color: "var(--text-secondary)" }} />;
  }

  const rootSections = getRootCategories();
  const sections = activeSection === "All" ? rootSections : rootSections.filter((s) => s.name.en === activeSection);

  const filteredSections = sections.map((section) => ({
    ...section,
    scrolls: getChildCategories(section.id).filter((b) => b.name.en.toLowerCase().includes(search.toLowerCase())),
  })).filter((s) => s.scrolls.length > 0);

  const noResults = search.trim().length > 0 && filteredSections.length === 0;
  const totalBooks = rootSections.reduce((sum, s) => sum + getChildCategories(s.id).length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
            Kingdom Library
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, maxWidth: 400, lineHeight: 1.5 }}>
            The Bible is not one book — it is a library. {totalBooks} scrolls organized across {rootSections.length} sections under the Kingdom Classification System (KCS).
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setShowAbout(!showAbout)}
            aria-label="About the Kingdom Classification System"
            style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", background: showAbout ? "rgba(212,168,67,0.15)" : "transparent", color: showAbout ? "var(--gold)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
          >
            <Info size={14} /> About KCS
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            style={{ padding: "6px 8px", background: view === "grid" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "grid" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            style={{ padding: "6px 8px", background: view === "list" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "list" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showAbout && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 6, fontFamily: "'Cinzel',serif" }}>Kingdom Classification System (KCS)</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 6 }}>
            The KCS organizes Scripture according to divine pattern: <strong>Foundation → History → Wisdom → Prophetic → Gospels → Acts → Epistles → Revelation</strong>. This system ensures truth is not just known, but applied for transformation.
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Navigation replaces memorization.</strong> You don&apos;t need to memorize every verse — learn how to visit the right scrolls at the right time. Each section has a specific purpose, and every citizen can contribute their own Acts, Epistles, and Revelations.
          </div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search scrolls by title or section..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPageBySection({}); }}
          aria-label="Search scrolls by title or section"
          style={{
            width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 15,
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button
          onClick={() => { setActiveSection("All"); setPageBySection({}); }}
          style={{
            padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
            background: activeSection === "All" ? "var(--gold)" : "transparent",
            color: activeSection === "All" ? "#fff" : "var(--text-secondary)",
          }}
        >
          All Sections
        </button>
        {rootSections.map((s) => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.name.en); setPageBySection({}); }}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6,
              border: "1px solid var(--border)", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              background: activeSection === s.name.en ? "var(--gold)" : "transparent",
              color: activeSection === s.name.en ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ display: "flex" }}>{sectionIcons[s.id]}</span>
            <span>{s.code}</span>
          </button>
        ))}
      </div>

      <ContinueReadingSection />

      {noResults && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
          No scrolls match &ldquo;{search}&rdquo;.
        </div>
      )}

      {filteredSections.map((section) => {
        const totalPages = Math.max(1, Math.ceil(section.scrolls.length / PAGE_SIZE));
        const page = Math.min(pageBySection[section.id] ?? 1, totalPages);
        const pagedScrolls = section.scrolls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

        return (
          <div key={section.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(90deg, rgba(212,168,67,0.05), transparent)",
            }}>
              <span style={{ display: "flex", color: "var(--gold)" }}>{sectionIcons[section.id]}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  {section.name.en}
                  <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, fontFamily: "monospace" }}>{section.code}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{section.description}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{section.scrolls.length} scrolls</span>
            </div>

            <div style={{ display: view === "grid" ? "grid" : "flex", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, padding: 14, flexDirection: view === "list" ? "column" : undefined }}>
              {pagedScrolls.map((scroll) => (
                view === "grid" ? (
                  <ScrollCard key={scroll.id} scroll={scroll} />
                ) : (
                  <ScrollListItem key={scroll.id} scroll={scroll} />
                )
              ))}
            </div>

            <ScrollPagination
              page={page}
              totalPages={totalPages}
              onPage={(n) => setPageBySection((prev) => ({ ...prev, [section.id]: n }))}
            />
          </div>
        );
      })}

      <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.08), var(--bg-card))", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
        <Feather size={24} color="var(--gold)" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Your Scroll</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, maxWidth: 400, margin: "0 auto 10px", lineHeight: 1.5 }}>
          Every citizen of the Kingdom can contribute — write your own Acts (actions), Epistles (letters), and Revelations (visions). Add your story to the living archive.
        </div>
        <button
          onClick={() => setWriteOpen(true)}
          style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Write Your Scroll
        </button>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--green-dim)", color: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "10px 16px", fontSize: 14, zIndex: 60 }}>
          {toast}
        </div>
      )}

      <WriteScrollModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmitted={() => {
          setWriteOpen(false);
          setToast("Your scroll has been submitted for review.");
          setTimeout(() => setToast(""), 3000);
        }}
      />
    </div>
  );
}
