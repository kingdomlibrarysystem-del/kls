/** Portal home routes — only highlighted when you are exactly there, never for every page under them. */
const PORTAL_ROOTS = new Set(["/dashboard", "/member"]);

/**
 * True when `href` is the page you are on or one of its descendants
 * (`/dashboard/users` matches `/dashboard/users/123`, but not
 * `/dashboard/users-archive`). Portal roots only match exactly — previously
 * `startsWith("/dashboard")` kept "Dashboard" highlighted on every admin page.
 */
export function routeMatches(currentRoute: string, href: string): boolean {
  if (PORTAL_ROOTS.has(href)) return currentRoute === href;
  return currentRoute === href || currentRoute.startsWith(`${href}/`);
}

/**
 * Of several sibling links, the single one to highlight: the longest href that
 * matches. So on /dashboard/e-learning/catalog only "Course Catalog" is active,
 * not also "Overview" (/dashboard/e-learning).
 */
export function activeHrefAmong(currentRoute: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (routeMatches(currentRoute, href) && (!best || href.length > best.length)) best = href;
  }
  return best;
}
