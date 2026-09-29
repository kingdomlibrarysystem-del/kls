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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionCard } from "./section-card";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

const publishingItems = [
  { icon: <Upload />, label: "Submit Manuscript", sub: "Submit your work", href: "/dashboard/publishing" },
  { icon: <ClipboardList />, label: "My Submissions", sub: "Track status", href: "/dashboard/publishing" },
  { icon: <CheckCircle />, label: "Review & Approve", sub: "Editorial review", href: "/dashboard/publishing/review" },
  { icon: <DollarSign />, label: "Revenue & Royalties", sub: "Earnings", href: "/dashboard/publishing/revenue" },
  { icon: <BookOpen />, label: "Publication Catalog", sub: "Browse catalog", href: "/dashboard/publishing/catalog" },
];

const researchItems = [
  { icon: <BarChart3 />, label: "Research Dashboard", sub: "Overview & Analytics", href: "/dashboard/research" },
  { icon: <FolderOpen />, label: "Research Projects", sub: "Manage & Track", href: "/dashboard/research" },
  { icon: <BookOpen />, label: "Research Library", sub: "Papers, Journals…", href: "/dashboard/research/repository" },
  { icon: <Upload />, label: "Publish Research", sub: "Journals & Papers", href: "/dashboard/research/repository" },
  { icon: <Handshake />, label: "Collaborations", sub: "Teams & Partnerships", href: "/dashboard/research/collaborations" },
];

function StatRow({ values, accent }: { values: [number, string][]; accent: "gold" | "teal" }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map(([v, l]) => (
        <div key={l} className={cn("rounded-lg border px-2 py-3 text-center", accent === "gold" ? "border-primary/25 bg-primary/5" : "border-info/25 bg-info/5")}>
          <div suppressHydrationWarning className={cn("font-cinzel text-xl font-bold leading-none", accent === "gold" ? "text-primary" : "text-info")}>{v.toLocaleString()}</div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}

function ItemList({ items, wide = false }: { items: typeof publishingItems; wide?: boolean }) {
  return (
    <div className={cn("grid grid-cols-1 gap-1 sm:grid-cols-2", wide ? "lg:grid-cols-3" : "mt-4 xl:grid-cols-1 2xl:grid-cols-2")}>
      {items.map((it) => (
        <Link key={it.label} href={it.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">{it.icon}</span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-foreground">{it.label}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{it.sub}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Publishing services card (right column) — real server-side counts. */
export function PublishingServices({ publications }: { publications: AdminDashboardData["publications"] }) {
  const { inProgress, published } = publications;
  return (
    <SectionCard
      icon={<Newspaper />}
      tone="gold"
      title="PUBLISHING SERVICES"
      description="Discover. Publish. Transform."
      className="flex-1 border-t-2 border-t-primary"
      footer={
        <Link href="/dashboard/publishing" className={cn(buttonVariants(), "h-9 w-full font-semibold")}>Start Publishing →</Link>
      }
    >
      <StatRow accent="gold" values={[[publications.total, "Books"], [inProgress, "In Progress"], [published, "Published"]]} />
      <ItemList items={publishingItems} />
    </SectionCard>
  );
}

/**
 * Research services card, laid out wide (stats beside a 3-column link grid)
 * so it fills the main column under the KCS classification.
 */
export function ResearchServices({ projects }: { projects: AdminDashboardData["projects"] }) {
  return (
    <SectionCard
      icon={<FlaskConical />}
      tone="teal"
      title="RESEARCH SERVICES"
      description="Discover. Publish. Transform."
      className="flex-1 border-t-2 border-t-info"
      action={
        <Link href="/dashboard/research" className={cn(buttonVariants({ variant: "outline" }), "h-8 border-info/40 px-3 text-xs font-semibold text-info hover:bg-info/10 hover:text-info")}>Go to Research Center →</Link>
      }
    >
      <div className="grid items-start gap-4 md:grid-cols-[200px_1fr]">
        <StatRow accent="teal" values={[[projects.total, "Projects"], [projects.active, "Active"]]} />
        <ItemList items={researchItems} wide />
      </div>
    </SectionCard>
  );
}
