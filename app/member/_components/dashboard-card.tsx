"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** The shared frame for every dashboard widget: icon + title + optional count, the body, and a "view all" link at the bottom. */
export function DashboardCard({
  icon,
  iconClass,
  title,
  meta,
  footerHref,
  footerLabel,
  className,
  children,
}: {
  icon: React.ReactNode;
  /** Colour of the icon chip, e.g. "bg-primary/15 text-primary". */
  iconClass: string;
  title: string;
  meta?: React.ReactNode;
  footerHref?: string;
  footerLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm", className)}>
      <header className="mb-4 flex items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h2>
        {meta != null && <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{meta}</span>}
      </header>
      <div className="flex-1">{children}</div>
      {footerHref && footerLabel && (
        <Link
          href={footerHref}
          className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-[#12304a] transition hover:gap-2 hover:text-primary dark:text-primary"
        >
          {footerLabel} <ChevronRight className="size-4" />
        </Link>
      )}
    </section>
  );
}

/** Friendly empty state inside a widget: an icon, a line of text, and a link to start. */
export function DashboardEmpty({ icon, text, href, linkLabel }: { icon: React.ReactNode; text: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      {href && linkLabel && (
        <Link href={href} className="text-sm font-semibold text-[#12304a] underline-offset-4 hover:underline dark:text-primary">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
