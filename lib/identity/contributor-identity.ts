/**
 * The signed-in contributor this mocked workspace represents. Used to
 * filter shared admin stores (course catalog, research collaborations,
 * research repository, publishing review queue) down to "this
 * contributor's own" records, since there is no real auth/session
 * concept wired up yet. Relocated here (from
 * app/contributor/_components/) during portal consolidation Phase 3 —
 * this file is genuinely shared cross-portal infrastructure (imported by
 * admin's revenue/repository/collaborations/review pages and
 * lib/messaging/**) that happened to live inside the contributor portal
 * folder; the CONTRIBUTOR_NAME data concept survives the portal's
 * removal (see portal-consolidation-audit.md §4).
 */
export const CONTRIBUTOR_NAME = 'Pastor Emmanuel Rugamba'

/** Real seeded User.id for CONTRIBUTOR_NAME — required for messaging's real Channel/Message API, which needs a real participantId, not just a display name. */
export const CONTRIBUTOR_ID = '6a6caab4cecf69deb2eaa1b7'
