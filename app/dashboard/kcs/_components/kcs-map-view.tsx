"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, Map } from "lucide-react";
import { useCategories } from "@/lib/kcs-taxonomy/use-categories";
import { getRootCategories, getCategoryById } from "@/lib/kcs-taxonomy";
import { KcsPillarView } from "./kcs-pillar-view";
import { KcsTaxonomyAnalytics } from "./kcs-taxonomy-analytics";
import { ManageCategoriesSection } from "./manage-categories-section";

/**
 * Client wrapper resolving the active pillar from the `?pillar=` search
 * param (so the tab bar's selection is a real, shareable/back-button-able
 * URL state, and the scroll-detail page's "Back to {pillar}" link can
 * target a specific tab) — replaces the previous 8 separate route files
 * (foundation/page.tsx, history/page.tsx, etc.), all of which rendered the
 * exact same KcsPillarView with only the pillarKey literal differing.
 *
 * The pillar is identified by its `slug` (e.g. "kcs-fnd") — the canonical
 * `Category.slug` already exists and is stable, so it's reused as the route
 * param instead of inventing a separate `key` field.
 *
 * Below the pillar browsing UI: a whole-taxonomy analytics summary, then a
 * real "Manage Categories" CRUD section — the former standalone
 * `/dashboard/library/categories` admin page, absorbed here since KCS Map
 * is now the single home for both browsing and managing this taxonomy.
 *
 * The default pillar can no longer be computed at module scope (that
 * assumed the mock's always-populated static array) — `getRootCategories()`
 * only has real data once `useCategories()`'s fetch resolves, so this
 * component gates its own render on that hook's `loading`/`error` state
 * before picking a default and rendering the rest of the page.
 */
export function KcsMapView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPillar = searchParams.get("pillar");
  const { loading, error } = useCategories();
  const [pillarSlug, setPillarSlug] = useState<string | null>(null);

  useEffect(() => {
    if (loading || error || pillarSlug) return;
    const defaultSlug = getRootCategories()[0]?.slug ?? null;
    setPillarSlug(
      paramPillar && getCategoryById(paramPillar) ? paramPillar : defaultSlug,
    );
  }, [loading, error, paramPillar, pillarSlug]);

  const handlePillarChange = (next: string) => {
    setPillarSlug(next);
    router.replace(`/dashboard/kcs?pillar=${next}`, { scroll: false });
  };

  // Only the genuinely-in-flight fetch shows the skeleton — a resolved
  // fetch with zero categories must NOT fall into this branch (it
  // previously did, since `pillarSlug` also starts `null` and stays
  // `null` forever when there's no root category to default to,
  // producing an infinite-looking loading state for a real empty
  // taxonomy, not an actual bug in useCategories()/the API).
  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading KCS Map">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load the KCS taxonomy"
        description={error}
      />
    );
  }

  // A real empty taxonomy (zero categories) has no pillar to default to
  // — render a real empty state instead of the loading skeleton, and
  // still surface Manage Categories so an admin can create the first
  // root category. Without this, an empty database was a genuine dead
  // end: the only UI that creates a category lived below the old gate.
  if (!pillarSlug) {
    return (
      <div>
        <EmptyState
          icon={Map}
          title="No KCS categories yet"
          description="Create the first root category below to get started."
        />
        <ManageCategoriesSection />
      </div>
    );
  }

  return (
    <div>
      <KcsTaxonomyAnalytics />
      <KcsPillarView
        pillarSlug={pillarSlug}
        onPillarChange={handlePillarChange}
      />
      <ManageCategoriesSection />
    </div>
  );
}
