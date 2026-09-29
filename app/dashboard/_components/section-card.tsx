import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned header slot (a link/button). */
  action?: React.ReactNode;
  /** Pinned to the bottom of the card, e.g. a "View all" link. */
  footer?: React.ReactNode;
  /** Title color accent — gold for most sections, teal for Research. */
  tone?: "default" | "gold" | "teal";
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * The one card shell every admin-home section uses (shadcn Card + theme
 * tokens), so headers, padding, radius and spacing line up across the page
 * in light and dark mode. Title uses a plain heading (not CardTitle) so it
 * inherits the dashboard font instead of the shadcn heading font.
 */
export function SectionCard({ icon, title, description, action, footer, tone = "default", className, contentClassName, children }: SectionCardProps) {
  const toneCls = tone === "gold" ? "text-primary" : tone === "teal" ? "text-info" : "text-foreground";
  return (
    <Card className={cn("gap-0 rounded-xl border border-border bg-card py-0 shadow-xs ring-0", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className={cn("flex items-center gap-2 text-sm font-bold tracking-wide", toneCls)}>
            {icon && <span className="flex shrink-0 items-center [&_svg]:size-4">{icon}</span>}
            <span className="truncate">{title}</span>
          </h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1 px-5 py-4", contentClassName)}>{children}</div>
      {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
    </Card>
  );
}

/** Consistent "View all →" footer link used by every section. */
export function SectionLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80", className)}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
