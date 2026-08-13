"use client";

import Link from "next/link";
import {
  Upload,
  ClipboardList,
  CheckCircle,
  DollarSign,
  BookOpen,
  BarChart3,
  FolderOpen,
  Handshake,
  Newspaper,
  FlaskConical,
} from "lucide-react";
import { usePublications } from "@/app/dashboard/publishing/_shared/use-publications";
import { useResearchProjects } from "@/app/dashboard/research/_shared/use-research-projects";

const publishingItems = [
  { icon: <Upload size={12} />, label: "Submit Manuscript", sub: "Submit your work", href: "/dashboard/publishing" },
  { icon: <ClipboardList size={12} />, label: "My Submissions", sub: "Track status", href: "/dashboard/publishing" },
  { icon: <CheckCircle size={12} />, label: "Review & Approve", sub: "Editorial review", href: "/dashboard/publishing/review" },
  { icon: <DollarSign size={12} />, label: "Revenue & Royalties", sub: "Earnings", href: "/dashboard/publishing/revenue" },
  { icon: <BookOpen size={12} />, label: "Publication Catalog", sub: "Browse catalog", href: "/dashboard/publishing/catalog" },
];

const researchItems = [
  { icon: <BarChart3 size={12} />, label: "Research Dashboard", sub: "Overview & Analytics", href: "/dashboard/research" },
  { icon: <FolderOpen size={12} />, label: "Research Projects", sub: "Manage & Track", href: "/dashboard/research" },
  { icon: <BookOpen size={12} />, label: "Research Library", sub: "Papers, Journals…", href: "/dashboard/research/repository" },
  { icon: <Upload size={12} />, label: "Publish Research", sub: "Journals & Papers", href: "/dashboard/research/repository" },
  { icon: <Handshake size={12} />, label: "Collaborations", sub: "Teams & Partnerships", href: "/dashboard/research/collaborations" },
];

function ItemGrid({ items }: { items: { icon: React.ReactNode; label: string; sub: string; href: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 8 }}>
      {items.map((it) => (
        <Link key={it.label} href={it.href} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-subtle)", borderRadius: 5, padding: "4px 5px", border: "1px solid var(--border-light)", textDecoration: "none" }}>
          <span style={{ display: "flex", alignItems: "center" }}>{it.icon}</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-primary)" }}>{it.label}</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{it.sub}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatRow({ values }: { values: [string, string][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${values.length},1fr)`, gap: 5, marginBottom: 8 }}>
      {values.map(([v, l]) => (
        <div key={l} style={{ textAlign: "center", background: "rgba(212,168,67,0.05)", border: "1px solid var(--border-gold)", borderRadius: 5, padding: "5px 4px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{v}</div>
          <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Publishing and Research services, both wired to real data. Beauty &
 * Wellness panel removed entirely (per explicit product decision): it's
 * a Phase-9 "Coming Soon" placeholder with zero backend, and showing
 * fabricated stats/actions for it here would misrepresent the module
 * as further along than it is.
 */
export default function RightPanels() {
  const { data: publications } = usePublications();
  const { data: projects } = useResearchProjects();

  const inProgress = publications.filter((p) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length;
  const published = publications.filter((p) => p.status === "PUBLISHED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Publishing */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold)", borderRadius: 8, padding: "10px 12px", marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Newspaper size={14} color="var(--gold)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>PUBLISHING SERVICES</span>
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Discover. Publish. Transform.</div>
        <StatRow values={[[String(publications.length), "Books"], [String(inProgress), "In Progress"], [String(published), "Published"]]} />
        <ItemGrid items={publishingItems} />
        <Link href="/dashboard/publishing" className="btn btn-gold btn-sm" style={{ width: "100%", justifyContent: "center", textAlign: "center" }}>Start Publishing →</Link>
      </div>

      {/* Research */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--teal)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <FlaskConical size={14} color="var(--teal-light)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-light)" }}>RESEARCH SERVICES</span>
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Discover. Publish. Transform.</div>
        <StatRow values={[[String(projects.length), "Projects"], [String(projects.filter((p) => p.status === "ACTIVE").length), "Active"]]} />
        <ItemGrid items={researchItems} />
        <Link href="/dashboard/research" className="btn btn-outline-dim btn-sm" style={{ width: "100%", justifyContent: "center", textAlign: "center", color: "var(--teal-light)", borderColor: "var(--teal)" }}>Go to Research Center →</Link>
      </div>

    </div>
  );
}
