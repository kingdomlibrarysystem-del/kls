import Link from "next/link";
import { BookOpen, Star, Plus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard, SectionLink } from "./section-card";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

/**
 * Popular Resources and Recently Added, both real and computed server-side
 * (a borrow groupBy for "popular", newest-by-createdAt for "recent"). Sales &
 * Store and News panels stay removed (no real backend — see git history).
 * Rows link to the resource's detail page.
 */
function ResourceRow({ href, title, sub, trailing }: { href: string; title: string; sub?: string; trailing?: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BookOpen className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
      </span>
      {trailing ?? <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
    </Link>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function PopularResources({ popular }: { popular: AdminDashboardData["popular"] }) {
  return (
    <SectionCard
      icon={<Star />}
      title="Popular Resources"
      description="Most borrowed titles."
      footer={<SectionLink href="/dashboard/library">View all resources</SectionLink>}
      contentClassName="px-3"
    >
      {popular.length === 0 ? (
        <EmptyLine>No borrowing activity yet.</EmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {popular.map((p) => (
            <ResourceRow
              key={p.resource.id}
              href={`/dashboard/library/${p.resource.id}`}
              title={p.resource.title}
              sub={p.resource.type}
              trailing={<Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{p.count} {p.count === 1 ? "borrow" : "borrows"}</Badge>}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function RecentlyAdded({ recent }: { recent: AdminDashboardData["inventory"]["newest"] }) {
  return (
    <SectionCard
      icon={<Plus />}
      title="Recently Added"
      description="Newest items in the collection."
      footer={<SectionLink href="/dashboard/library">View all items</SectionLink>}
      contentClassName="px-3"
    >
      {recent.length === 0 ? (
        <EmptyLine>No resources yet.</EmptyLine>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((r) => (
            <ResourceRow key={r.id} href={`/dashboard/library/${r.id}`} title={r.title} sub={r.type} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
