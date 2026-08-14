/**
 * Canonical KCS taxonomy module — single source of truth for the 8 KCS
 * root pillars and their 75 child scrolls, replacing the 3 previously
 * hand-duplicated copies (see `types.ts` header comment for the full list).
 */
export type { Category, CategoryStatus, CategoryFormState } from './types'
export { EMPTY_CATEGORY_FORM } from './types'
export { categories, getCategoryById, getRootCategories, getChildCategories, resourceCountFor, getCategoryName, getParentName, getScrollImage } from './taxonomy-helpers'
export { toSlug } from './slug'
