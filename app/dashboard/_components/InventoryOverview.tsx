import Link from "next/link";
import { Package, Plus, User, BarChart3, Database, Zap } from "lucide-react";
import { mediaTypeLabels } from "@/app/dashboard/library/_components/resources-data";
import { SectionCard, SectionLink } from "./section-card";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

// Slice colors come from the theme chart tokens so the donut follows light/dark mode.
const sliceColors: Record<string, string> = {
  TEXT: "var(--chart-1)",
  VIDEO: "var(--chart-4)",
  AUDIO: "var(--chart-5)",
  DOCUMENT: "var(--chart-2)",
  COMBINATION: "var(--chart-3)",
};

const quickActions = [
  { icon: <Plus />, label: "Add New Item", sub: "Add book, audio, video…", href: "/dashboard/library" },
  { icon: <User />, label: "Register Member", sub: "Add new library member…", href: "/dashboard/users" },
  { icon: <BarChart3 />, label: "Generate Report", sub: "View analytics report…", href: "/dashboard/reports" },
  { icon: <Database />, label: "Manage Categories", sub: "KCS taxonomy…", href: "/dashboard/library/kcs" },
];

/** Real inventory breakdown by mediaType as a donut (aggregated server-side, lib/data/admin-dashboard.ts). */
export default function InventoryOverview({ inventory }: { inventory: AdminDashboardData["inventory"] }) {
  const { totalItems } = inventory;
  const slices = inventory.byMediaType
    .map(({ mediaType, qty: count }) => ({
      label: mediaTypeLabels[mediaType as keyof typeof mediaTypeLabels] ?? mediaType,
      count,
      pct: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      color: sliceColors[mediaType] ?? "var(--muted-foreground)",
    }))
    .filter((s) => s.count > 0);

  return (
    <SectionCard
      icon={<Package />}
      title="Inventory Overview"
      description="Copies in the collection by media type."
      footer={<SectionLink href="/dashboard/library">Manage inventory</SectionLink>}
    >
      {slices.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No resources yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
          <svg width="132" height="132" viewBox="0 0 36 36" className="shrink-0" role="img" aria-label={`${totalItems} total items`}>
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--muted)" strokeWidth="3.5" />
            {(() => {
              let offset = 0;
              return slices.map((s) => {
                const el = (
                  <circle key={s.label} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={-offset + 25} />
                );
                offset += s.pct;
                return el;
              });
            })()}
            <text suppressHydrationWarning x="18" y="17.5" textAnchor="middle" className="font-cinzel" style={{ fill: "var(--foreground)", fontSize: "6px", fontWeight: 700 }}>{totalItems.toLocaleString()}</text>
            <text x="18" y="22.5" textAnchor="middle" style={{ fill: "var(--muted-foreground)", fontSize: "2.6px" }}>Total Items</text>
          </svg>
          <ul className="w-full flex-1 space-y-2">
            {slices.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                <span className="flex-1 text-muted-foreground">{s.label}</span>
                <span suppressHydrationWarning className="font-semibold text-foreground">{s.count.toLocaleString()}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

/** The four admin shortcuts as an even 2×2 grid of real links. */
export function QuickActions() {
  return (
    <SectionCard icon={<Zap />} title="Quick Actions" description="Common admin tasks.">
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            aria-label={a.label}
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">{a.icon}</span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{a.label}</span>
              <span className="block text-xs text-muted-foreground">{a.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
