"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, Library } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mediaTypeLabels } from "@/app/dashboard/library/_components/resources-data";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

const tabFilters = ["All", "TEXT", "VIDEO", "AUDIO", "DOCUMENT", "COMBINATION"] as const;

/** Hero: welcome + real library search on the left, real per-mediaType collection totals (aggregated server-side, passed in) on the right. */
export default function WelcomeSection({ inventory }: { inventory: AdminDashboardData["inventory"] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<typeof tabFilters[number]>("All");
  const { totalItems } = inventory;

  const handleSearch = () => {
    router.push(`/dashboard/library${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <section className="grid overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:grid-cols-[1fr_300px]">
      {/* Left — welcome + search */}
      <div className="relative p-6 sm:p-8" style={{ background: "var(--welcome-gradient)" }}>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2" style={{ backgroundImage: "var(--welcome-glow)" }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary">WELCOME TO THE</p>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Clock /> 24/7 Library Access
            </Badge>
          </div>
          <h1 className="mt-2 font-cinzel text-3xl font-bold leading-tight text-foreground sm:text-4xl">KINGDOM LIBRARY</h1>
          <p className="mt-1 text-sm text-muted-foreground">Learn. Innovate. Share Knowledge.</p>

          <form
            className="mt-6 flex max-w-xl gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search books, audio, video, newspapers, and more..."
                className="h-10 bg-card pl-9 text-sm"
              />
            </div>
            <Button type="submit" className="h-10 px-5 font-semibold">Search</Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {tabFilters.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  activeTab === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/70 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {t === "All" ? "All" : mediaTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right — collection summary */}
      <div className="flex flex-col border-t border-border p-6 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Library className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">TOTAL COLLECTION</p>
            <p suppressHydrationWarning className="font-cinzel text-3xl font-bold leading-none text-primary">{totalItems.toLocaleString()}+</p>
          </div>
        </div>
        <p className="mt-1 pl-[52px] text-xs text-muted-foreground">Items Available</p>

        <ul className="mt-5 flex-1 space-y-2">
          {inventory.byMediaType.length === 0 ? (
            <li className="text-xs text-muted-foreground">No resources yet.</li>
          ) : (
            inventory.byMediaType.map(({ mediaType, qty }) => (
              <li key={mediaType} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{mediaTypeLabels[mediaType as keyof typeof mediaTypeLabels] ?? mediaType}</span>
                <span suppressHydrationWarning className="font-semibold text-foreground">{qty.toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>

        <Link href="/dashboard/library" className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-9 w-full")}>
          View Collection
        </Link>
      </div>
    </section>
  );
}
