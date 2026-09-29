import Link from "next/link";
import { BookOpen, AlertTriangle, CalendarClock, Bookmark, Users, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

interface Kpi {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  /** Tailwind classes for the icon chip (bg + text) — theme status tokens. */
  tone: string;
}

/**
 * One row of equal-size KPI cards (real server-side counts) — merges the old
 * Borrow/Return tile strip and the Active Members / Items Borrowed stats bar
 * so every headline number shares one visual language.
 */
export default function DashboardKpis({ borrow, reservationsTotal, membersTotal }: {
  borrow: AdminDashboardData["borrow"];
  reservationsTotal: number;
  membersTotal: number;
}) {
  const kpis: Kpi[] = [
    { label: "Currently Borrowed", value: borrow.active, icon: <BookOpen />, href: "/dashboard/library/borrowings", tone: "bg-info/10 text-info" },
    { label: "Overdue Items", value: borrow.overdue, icon: <AlertTriangle />, href: "/dashboard/library/borrowings", tone: "bg-destructive/10 text-destructive" },
    { label: "Due Today", value: borrow.dueToday, icon: <CalendarClock />, href: "/dashboard/library/borrowings", tone: "bg-warning/10 text-warning" },
    { label: "Reservations", value: reservationsTotal, icon: <Bookmark />, href: "/dashboard/reservations", tone: "bg-primary/10 text-primary" },
    { label: "Active Members", value: membersTotal, icon: <Users />, href: "/dashboard/users", tone: "bg-success/10 text-success" },
    { label: "Items Borrowed", value: borrow.total, icon: <Download />, href: "/dashboard/library/reports", tone: "bg-primary/10 text-primary" },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6" aria-label="Key figures">
      {kpis.map((k) => (
        <Link key={k.label} href={k.href} className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full gap-0 rounded-xl border border-border bg-card px-4 py-4 shadow-xs ring-0 transition-colors group-hover:border-primary/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", k.tone)}>{k.icon}</span>
            </div>
            <p suppressHydrationWarning className="mt-3 font-cinzel text-2xl font-bold leading-none text-foreground">{k.value.toLocaleString()}</p>
          </Card>
        </Link>
      ))}
    </section>
  );
}
