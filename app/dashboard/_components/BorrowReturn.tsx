import Link from "next/link";
import { BookOpen, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Bookmark, BookX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SectionCard, SectionLink } from "./section-card";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

const statusCls: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  returned: "border-border bg-muted text-muted-foreground",
  pending: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-border bg-muted text-muted-foreground",
};

/**
 * Borrow / Return / Reservations: the loan workflow shortcuts plus the 6 most
 * recent loans (server-side query, lib/data/admin-dashboard.ts). The headline
 * counts moved to DashboardKpis so every KPI shares one card style.
 */
export default function BorrowReturn({ borrow }: { borrow: AdminDashboardData["borrow"] }) {
  const recentLoans = borrow.recent;
  const btn = (variant: "default" | "outline") => cn(buttonVariants({ variant }), "h-9 px-3");

  return (
    <SectionCard
      icon={<BookOpen />}
      title="Borrow, Return & Reservations"
      description="Recent loan activity and the day-to-day circulation shortcuts."
      footer={<SectionLink href="/dashboard/library/borrowings">View all loans</SectionLink>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/library/borrowings" className={btn("default")}><ArrowDownToLine /> Borrow Item</Link>
        <Link href="/dashboard/library/borrowings" className={btn("outline")}><ArrowUpFromLine /> Return Item</Link>
        <Link href="/dashboard/library/borrowings" className={btn("outline")}><ClipboardList /> My Loans</Link>
        <Link href="/dashboard/reservations" className={btn("outline")}><Bookmark /> My Reservations</Link>
      </div>

      <p className="mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground">RECENT BORROWED ITEMS</p>
      {recentLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <BookX className="mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No borrowings yet</p>
          <p className="text-xs text-muted-foreground">Loans will appear here as members borrow items.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-3 text-xs text-muted-foreground">Item</TableHead>
                <TableHead className="px-3 text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="px-3 text-xs text-muted-foreground">Borrowed On</TableHead>
                <TableHead className="px-3 text-xs text-muted-foreground">Due Date</TableHead>
                <TableHead className="px-3 text-xs text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="max-w-[220px] truncate px-3 font-medium text-foreground">{l.resourceTitle}</TableCell>
                  <TableCell className="px-3 text-muted-foreground">{l.resourceType}</TableCell>
                  <TableCell className="px-3 text-muted-foreground">{l.borrowDate}</TableCell>
                  <TableCell className="px-3 text-muted-foreground">{l.dueDate}</TableCell>
                  <TableCell className="px-3">
                    <Badge variant="outline" className={cn("capitalize", statusCls[l.status] ?? statusCls.returned)}>{l.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
