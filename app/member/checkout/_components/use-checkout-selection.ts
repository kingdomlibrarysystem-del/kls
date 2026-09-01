'use client'

/**
 * Reads which cart item ids to check out from the URL (?items=id1,id2),
 * set by the Cart page's "Pay All"/"Pay Selected" action — the checkout
 * page itself has no cart-loading logic of its own, it re-fetches the
 * live cart and filters to these ids so prices/covers are always fresh.
 */
export function parseSelectedItemIds(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('items')
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}
