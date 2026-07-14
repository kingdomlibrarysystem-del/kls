# Autonomous Run Progress

Working through the combined remaining backlog from
`.claude/skills/kls-page-builder/references/lecturer-feature-audit.md`
(2 Rough items) and `.claude/skills/kls-page-builder/references/ux-journey-audit.md`
(8 Rough + 8 Polish items), per CLAUDE.md's Autonomous Mode protocol.

Branch: `auto-wip` (not `main`). Each phase = one commit, pushed after
`npm run build` + `npx tsc --noEmit` pass clean.

## Phase list (18 items)

1. Decorative purple/teal gradient avatar — `components/session-room/participant-tile.tsx:37`
2. Tailwind status classes in a Dialect-B data file — `app/lecturer/_shared/session-requests-data.ts:22-25`
3. Course completion → assessment discoverability nudge missing
4. Reservation stuck at `Waiting` forever — no path to `Ready`
5. Reserve queue "ahead of you" off-by-one copy
6. `/contributor` dashboard stat cards hardcoded, not live
7. Roles/Users/Invitations/Audit-log CRUD state lost on remount (not a shared store)
8. Lesson content pane "Download" button inert
9. `/member/library` "Write Your Scroll" CTA inert
10. Review Queue empty-by-default (seed-data reachability)
11. Scroll detail → Reserve unreachable from `/member/library/[section]/[scrollId]`
12. Add Course doesn't auto-navigate to catalog after success
13. `/dashboard/reports` "Total Members" reads a plain constant, not live
14. `/member/borrowings` + `/member/reservations` missing Skeleton/EmptyState
15. `/dashboard/roles` missing Skeleton loading phase
16. Dialect A classes hardcoded inside DataTable render callbacks (systemic, ~5+ files)
17. `/contributor` charts read static imports, not subscribable hooks
18. Login accepts any email silently, no validation feedback for non-seed addresses

## Log

1. **Decorative gradient avatar fixed** — `components/session-room/participant-tile.tsx:37`. Replaced `linear-gradient(135deg, var(--purple), var(--teal))` with solid `var(--gold)`, matching the page-builder color-discipline rule (no decorative non-status hues). Build + `tsc --noEmit` clean.
2. **Tailwind-in-Dialect-B fixed** — `app/lecturer/_shared/session-requests-data.ts:21-26`. `sessionStatusConfig` fed both Dialect-A consumers (`sessions-view.tsx`, `sessions-stats.tsx` — Tailwind `cls` correct there, kept unchanged) and one Dialect-B consumer (`session-card.tsx`, pure inline-style component) off the same Tailwind class string. Added `bg`/`color`/`border` CSS-variable tokens to each status entry and switched `session-card.tsx`'s badge to inline `style={{...}}` using those tokens, leaving `cls` untouched for the two Dialect-A files. Build + `tsc --noEmit` clean.
3. **Assessment discoverability nudge added** — `lesson-viewer-view.tsx` now detects when every lesson in the current course is complete and looks up the course's linked assessment via `useAssessmentCatalog()` (matched on `courseId`). When found, `LessonContentPane` renders a gold-accented nudge card with the assessment title and a "Take Assessment" link to `/member/assessments`, so a member no longer has to separately know to look there. Build + `tsc --noEmit` clean.
4. **Reservation `Waiting` → `Ready` dead end fixed, together with the queue off-by-one (items 4 and 5 — same function, fixed as one coherent change)** — `app/member/_shared/use-reservations.ts`. `addReservation()` used to always create `status: 'Waiting'` with `queue: queueAhead + 1`, and nothing anywhere ever promoted a reservation to `Ready`. Now: (a) `addReservation()` computes `queue` as the literal count of reservations ahead (no `+1`) and sets `status: 'Ready'` immediately if that count is 0; (b) `fulfillReservation()` — the existing trigger point for freeing up a copy — now also decrements the `queue` of every other `Waiting` reservation for that same title and promotes whichever reaches `queue === 0` to `Ready`. This keeps the fix self-contained inside the reservations store rather than wiring a new cross-module link to the separate admin-side borrowings/resources data (which would have been a larger, riskier shared-data-model change out of scope for this item). Build + `tsc --noEmit` clean.
5. **Reserve queue off-by-one** — fixed as part of item 4 above (same commit/function).
6. **`/contributor` dashboard stat cards wired to live data** — `dashboard-data.ts` no longer stores hardcoded `value`s; `dashboard-view.tsx` now computes each stat from the same shared store its own dedicated page already reads: submission count from `useMySubmissions()`, course count from `useCourseCatalog()` filtered by `CONTRIBUTOR_NAME`, project count from `mockProjects` filtered by contributor membership, and earnings from `useRevenue()` filtered by contributor and reduced the same way `earnings-view.tsx` already does. The dashboard summary can no longer drift from what My Submissions/My Courses/My Research/Earnings individually show. Build + `tsc --noEmit` clean.
7. **Roles/Users/Invitations CRUD converted to shared `useSyncExternalStore` stores** — Audit-log was already correctly wired to `use-audit-log.ts` in a prior session (verified: `audit-log-view.tsx` already calls `useAuditLog()`), so the actual remaining scope was 3 pages, not 4. Created `use-users.ts`, `use-roles.ts`, `use-invitations.ts`, each a module-level mutable store following the exact `use-audit-log.ts` pattern already used elsewhere (`use-resources.ts`, `use-reservations.ts`, etc.). `users-view.tsx`, `roles/page.tsx`, and `invitations/page.tsx` now read from `useUsers()`/`useRoles()`/`useInvitations()` instead of page-local `useState` seeded from the static arrays, so Create/Edit/Delete on all three pages now survive a route remount instead of silently resetting to seed data. Build + `tsc --noEmit` clean.
8. **Lesson content pane "Download" button wired** — `lesson-content-pane.tsx`. There's no real backing file anywhere in this mocked prototype (`lesson.content` is only ever a filename string like `foundation-reading-guide.pdf`), so faking a `fetch` would have violated the frontend-only rule. Added a `downloadLessonFile()` helper that builds a small text `Blob` client-side and triggers a real browser download via a temporary `<a download>` element — the button now does something real instead of being inert, without any network call. Build + `tsc --noEmit` clean.
9. **`/member/library` "Write Your Scroll" CTA wired** — new `write-scroll-modal.tsx` (Act/Epistle/Revelation type picker, title, body — this is personal reflective writing, distinct from the contributor-only publishing submission flow, so no existing flow was reused). Fully mocked: submitting shows a confirmation toast and closes, since there's no "My Scrolls" list page yet to append to. `page.tsx` stayed under the 200-line cap (188 lines) by keeping the modal in its own file. Build + `tsc --noEmit` clean.
10. **Review Queue empty-by-default fixed** — `app/member/_shared/enrollment-data.ts`. Seeded a third `initialAssessmentAttempts` row for assessment `'2'` (the Midterm with an OPEN question) with `reviewStatus: 'PENDING_REVIEW'` and a real `openAnswers.q4` entry, matching exactly the shape `recordAssessmentAttempt()` itself would produce (auto-graded score 30/50 from q1–q3, q4 awaiting a manager grade). `/dashboard/e-learning/quizzes/review` now has something to review by default instead of only after a member takes that assessment in the same session. `/member/assessments` correctly buckets it under "Under Review," not a fabricated pass/fail. Build + `tsc --noEmit` clean.
11. **Scroll detail → Reserve wired** — `scroll-detail-view.tsx` (`/member/library/[section]/[scrollId]`). Previously only rendered a Borrow button, and only when `availableQty > 0` — Reserve was completely unreachable from this entry point, and out-of-stock resources showed no action at all. Now shows both Borrow (when in stock) and Reserve (always, when authenticated) per matched resource, mirroring the exact pattern `publication-detail-view.tsx` already uses. Also fixed a related latent bug this surfaced: the modal was keyed off a single `matches.find(r => r.availableQty > 0)` guess, which meant it would never render at all for an all-out-of-stock scroll even with the new Reserve button — replaced with an explicit `actionTarget` set by whichever resource's button was actually clicked. Build + `tsc --noEmit` clean.

## Needs human input

(None yet.)
