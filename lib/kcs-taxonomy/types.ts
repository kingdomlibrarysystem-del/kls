/**
 * Canonical Kingdom Classification System (KCS) taxonomy types — the single
 * source of truth replacing 3 previously hand-duplicated copies:
 * `app/dashboard/library/categories/_components/categories-data.ts`
 * (admin CRUD shape), `app/dashboard/kcs/_components/kcs-pillars-data.ts`
 * (rich pillar/scroll content), and `app/member/library/_components/library-data.tsx`
 * (member summary — confirmed to add nothing unique once folded in here).
 */

/** Lifecycle status for a leaf/scroll-level category row. Roots never carry a status. */
export type CategoryStatus = 'AVAILABLE' | 'ARCHIVED' | 'OUT_OF_STOCK'

/**
 * A single taxonomy node — either one of the 8 KCS root pillars or one of
 * its child scrolls (Bible books). Roots and children share one flat shape
 * rather than two separate types so admin CRUD, the KCS Map, and the member
 * library can all walk the same tree without adapters.
 *
 * Root-only fields (`code`, `subtitle`, `range`, `theme`, `description`,
 * `detail`, `heroImage`) are populated for the 8 pillars and left undefined
 * on children. `status` is the inverse — undefined on roots, always set on
 * children (ports the old `Scroll.status` field 1:1).
 */
export interface Category {
  /** Stable id — the category's own slug (see taxonomy.ts header comment for why slug-as-id is safe here). */
  id: string
  slug: string
  name: { en: string; fr: string; rw: string }
  parentId: string | null
  /** KCS classification code, e.g. "KCS-FND". Roots only. */
  code?: string
  /** Tagline, e.g. "Constitution of the Kingdom". Roots only. */
  subtitle?: string
  /** Book span covered by this pillar, e.g. "Genesis – Deuteronomy". Roots only. */
  range?: string
  /** Theme phrase, e.g. "Origins and Covenant". Roots only. */
  theme?: string
  /** One-sentence description. Roots only. */
  description?: string
  /** Longer descriptive paragraph. Roots only. */
  detail?: string
  /** Hero/header image URL. Roots only. */
  heroImage?: string
  /** Availability status. Leaf/scroll rows only. */
  status?: CategoryStatus
  createdAt: string
}

/** Form state for the admin Categories create/edit panel. */
export interface CategoryFormState {
  nameEn: string
  nameFr: string
  nameRw: string
  slug: string
  parentId: string
}

export const EMPTY_CATEGORY_FORM: CategoryFormState = {
  nameEn: '', nameFr: '', nameRw: '', slug: '', parentId: '',
}
