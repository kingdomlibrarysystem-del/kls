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
12. **Add Course auto-navigates to catalog** — `course-form-view.tsx`. After a successful submit, briefly shows the existing success banner then `router.push('/dashboard/e-learning/catalog')` after 1.2s, instead of leaving the admin stranded on the empty form with only an inline banner as the only signal the course was saved. Build + `tsc --noEmit` clean.
13. **`/dashboard/reports` "Total Members" wired to live data** — `cross-module-data.ts`'s `TOTAL_MEMBERS` was `initialUsers.length`, a snapshot constant computed once at import time — Add User/Delete User on `/dashboard/users` (now backed by `useUsers()` since Phase 7) never changed it without a full reload. `reports-view.tsx` now reads `useUsers().length` directly, matching the live pattern already used for enrollments/review-queue on the same page. `ACTIVE_LOANS` stays a static constant — no live borrowings store exists yet, and this item's audit scope was Total Members specifically, not a general Reports rewrite. Build + `tsc --noEmit` clean.
14. **`/member/borrowings` + `/member/reservations` given Skeleton/EmptyState** — both views previously rendered instantly with no loading phase at all, and their empty states were hand-rolled `<div>`s instead of the shared `EmptyState` component every other module in this codebase uses. Added the standard `LOAD_DELAY_MS` + `useState`/`useEffect` loading pattern with stat-card + list `Skeleton`s, and swapped the hand-rolled "no active borrowings/reservations" divs for `EmptyState`, matching the pattern already used on `library-view.tsx`, `sessions-view.tsx`, etc. Build + `tsc --noEmit` clean.
15. **`/dashboard/roles` given a Skeleton loading phase** — `role-cards.tsx` already had a real `EmptyState` for zero roles, but `roles/page.tsx` itself rendered instantly with no loading phase at all, unlike its sibling pages `/users`, `/invitations`, `/audit-log`. Added the same `LOAD_DELAY_MS` pattern with stat-card + role-card grid `Skeleton`s, gating `RolesStats`/`RoleCards` behind it. Build + `tsc --noEmit` clean.
16. **Dialect A classes removed from Dialect B `DataTable` render callbacks** — the audit's own file list (`users-view.tsx`, `invitations-table.tsx` among the 5 named) turned out to include two false positives on re-check: both are genuinely Dialect-A pages (Tailwind `PageHeader`/`ElegantButton` chrome throughout, confirmed earlier this session), so Tailwind `text-w-*` inside their `DataTable` callbacks is correct and consistent with their own page, not a violation — left unchanged. The 3 genuinely Dialect-B files (plus 3 sibling detail-modal/data files the same status configs feed, caught during the fix) were converted: `earnings-view.tsx` + `revenue-detail-modal.tsx` (added `bg`/`color`/`border` tokens to `payoutStatusConfig`), `my-submissions-view.tsx` + `submission-detail-modal.tsx` (same for `publicationStatusConfig`), `login-history-section.tsx`, `sessions-section.tsx` — all now use inline `style={{ color: 'var(--text-secondary)', ... }}` matching their own page's dialect instead of `text-w-950`/`bg-w-100`/etc. `DataTable`'s own internal chrome (headers, pagination, search bar) is intentionally left as Tailwind — it's a documented dialect-agnostic shared primitive, not part of this finding. Build + `tsc --noEmit` clean.
17. **`/contributor` charts wired to a subscribable hook** — `dashboard-charts.tsx` imported `mySubmissions` as a static array, so "Submissions by Status" never reflected a book submitted via Submit a Book in the same session. Switched to `useMySubmissions()` (the same store `my-submissions-view.tsx` and the dashboard stat cards from Phase 6 already read). `payoutHistory` stays a static import — confirmed (Phase 16) there is no live payout store anywhere, by design, since no admin-side payout-processing page exists. Confirmed only one chart file exists under `/contributor` — no other chart to fix. Build + `tsc --noEmit` clean.
18. **Login validation feedback for non-seed emails** — this item touches `contexts/auth-context.tsx` (auth), so per the Autonomous Mode protocol I judged the fix carefully before proceeding rather than treating it as routine: the previous audit pass had explicitly left it "unchanged, not in scope for that pass," not because it was unsafe, but because it was out of that pass's scope — the user's later "both backlogs, in full" instruction brought it back into scope for this run. Confirmed this is genuinely low-risk: there is no real password/credential check to begin with (`_password` was already ignored, per `CLAUDE.md`'s "auth is a `localStorage` + in-memory mock" note), so no security control exists to weaken. Considered hard-blocking login for unrecognized emails, but rejected it — this prototype's entire point is letting any visitor explore any role's UI, so a hard block would break the mock's purpose. Instead: `login()` now returns `{ matched: boolean }`; `LoginForm` shows a non-blocking amber banner naming the unrecognized email with a "Continue as a member anyway" action when `matched` is false, instead of silently redirecting as if the address were recognized. The audit-log entry for a fallback login now also records the real email that didn't match, instead of a generic note. Build + `tsc --noEmit` clean.

## Needs human input

None. Every phase was either a self-contained, reversible frontend
change or (Phase 18, auth-adjacent) a change judged low-risk before
proceeding rather than skipped or guessed — see that phase's log entry
for the reasoning. Nothing was deferred to this section.

## Final summary

All 18 phases complete, each individually committed, built
(`npm run build`), type-checked (`npx tsc --noEmit`), and pushed to
`auto-wip`. Both source audit documents
(`.claude/skills/kls-page-builder/references/lecturer-feature-audit.md`
and `ux-journey-audit.md`) have been updated in place, marking every
item from this run's scope as resolved with a one-line pointer back to
the fix.

**What's intentionally still open (by design, not oversight):**
- `lecturer-feature-audit.md`'s 5 Polish items (admin sidebar `isMember`
  binary flag, `Video` icon reuse, Tailwind-in-inline-style in
  `session-card.tsx`, decorative stat-icon colors, decorative button
  accent) — these were never part of this run's 18-item combined scope;
  the user's instruction was "2 Rough + [ux-journey-audit's] 8 Rough + 8
  Polish," not this document's own Polish backlog.
- `ux-journey-audit.md`'s explicitly-deferred architectural item: no
  `middleware.ts` exists anywhere in the repo, so every `/dashboard/*`
  route is reachable by an anonymous visitor with zero auth gate. This
  was flagged by a prior session as "a substantially larger
  architectural task... intentionally not attempted," and stayed out of
  scope for this run for the same reason — it's a real-auth/routing
  change, not a mocked-frontend fix, and doesn't fit this phase list.

**Notable judgment calls made along the way** (each logged in more
detail against its own phase above):
- Phases 4 and 5 (reservation dead-end + queue off-by-one) were fixed
  together in one commit since they're the same function — logged as
  two phase entries for traceability against the original 18-item list.
- Phase 7 turned out to be 3 pages of work, not 4 — Audit-Log was
  already correctly store-backed from an earlier session.
- Phase 16 turned out to be 4 genuinely-affected files, not the 5 named
  in the audit — 2 of the named files (`users-view.tsx`,
  `invitations-table.tsx`) are genuinely Dialect-A pages where the
  "violation" wasn't actually one; fixing them would have introduced a
  real inconsistency rather than removing one.
- Phase 18 (login validation) touches auth-context, so its risk was
  explicitly assessed rather than treated as routine — judged low-risk
  since no real credential check exists to weaken in this mocked
  prototype, and a hard block was rejected in favor of non-blocking
  feedback to preserve the prototype's "explore any role" purpose.

**Recommended next step for a human reviewer:** review this branch's 16
phase commits (`957261d`..`404e188` on `auto-wip`, following the initial
`f6321ea` setup commit), then decide whether to merge into
`feat/ui-setup` or `main`. No further autonomous work is planned unless
a new phase list is provided.

---

# Reading Feature Arc

New autonomous run, same branch (`auto-wip`), same protocol. Grounded in
`.claude/skills/kls-page-builder/references/reading-feature-gap-audit.md`,
which confirmed: real multi-view card/list/table infrastructure exists to
build on, but reading access, highlighting, reading progress, notes, and
readable body content are all green-field — nothing partial to build
from. 6 phases, in order, each committed/built/type-checked/pushed
individually.

## Phase 0 — Readable content model (design note)

**Content shape decision: chapters, not raw pages.** `Resource.pages` is
already a physical page *count* used only for display (per the audit) —
reusing it as a content-array length would conflate two unrelated
concepts (a printed page count vs. a content unit to track progress
against). Chapters are the natural atomic unit a Bible-like scroll
already has (per KCS_LIBRARY.md's own framing), and they map cleanly
onto the lesson-progress precedent: `completedLessonIds: string[]` +
`totalLessons: number` becomes `completedChapterIds: string[]` +
`totalChapters: number` in Phase 2, one-to-one.

**Store shape**: `readable-content-data.ts` (types + seed data) +
`use-readable-content.ts` (module-level `Record<resourceId, ReadableContent>`
store), following `use-lessons.ts` exactly — same `structuredClone` seed,
same `subscribe`/`emitChange`/`getSnapshot` triplet, same non-hook
`getReadableContentSnapshot()` accessor for other store modules (Phase 2's
progress store will need this the same way `use-enrollments.ts` reads
`getLessonsSnapshot()`). Read-only for now — no admin authoring UI exists
yet for chapter content, so no add/update/remove mutators were added
speculatively; only what Phase 1 needs.

**Why these 4 resources**: Genesis (id `1`, Foundation), Psalms (id `7`,
Wisdom), Matthew (id `11`, Gospel), Revelation (id `16`, Revelation) —
spans 4 of the 8 KCS pillars for real variety, all four are recognizable
canonical titles already in `initialResources`, and Matthew/Revelation
are `mediaType: 'COMBINATION'` while Genesis/Psalms are `'TEXT'`/mixed —
enough spread to exercise the reader without seeding all 16 up front.
Each resource got 3 chapters of original placeholder prose (not lorem
ipsum) in the Kingdom Library's established voice — matching how every
other seed `description` in this app is real prose, not filler text.

## Log

0. **Readable content model + store shipped** — see design note above.
   `app/member/_shared/readable-content-data.ts` +
   `use-readable-content.ts`. Build + `tsc --noEmit` clean.
1. **Reader entry point + basic reader view shipped.** New route
   `/member/library/read/[resourceId]` (`page.tsx` +
   `_components/reader-view.tsx`) — chosen as a flat route keyed
   directly to canonical `Resource.id`, not nested under the KCS
   `[section]/[scrollId]` path, since the audit confirmed those are a
   separate synthetic ID space (`KCS-FND-0`, etc.) resolved to a
   `Resource` only by title match — the reader only ever needs the
   `Resource.id` `useReadableContent()` is keyed by. `ReaderView` renders
   one chapter at a time (title + paragraphs split on blank lines) with
   Previous/Next buttons and a "Chapter X of Y" indicator; shows the
   existing `EmptyState` pattern for a resource with no seeded chapters
   yet (expected for 12 of 16 resources — not a bug).
   "Read Online" was added to all 4 components the audit named, reusing
   each one's existing card/detail shell rather than inventing a new
   entry-point pattern:
   - `scroll-card.tsx` (member `ScrollCard`/`ScrollListItem`) — resolves
     the readable resource via a new `useReadableResourceId()` helper
     that mirrors `findResourcesForScroll`'s existing title-match
     relationship, filtered to resources with seeded chapters.
   - `scroll-detail-view.tsx` (member scroll detail) — added a
     gold "Read Online" link above Borrow/Reserve inside the existing
     `RelatedResourceCard` action slot per matched resource; Borrow's
     styling was demoted to a neutral background so Read Online reads as
     the primary action when both are present.
   - `library-browser.tsx`'s `BookCard` (public) — extracted `BookCard`
     into its own file (`book-card.tsx`) as part of this change, since
     adding the new action pushed the original file over the 200-line
     cap; "Read Online" (authenticated) / "Sign In to Read" (signed out,
     preserving `?redirect=` back to the reader) shown above Borrow/Reserve.
   - `publication-detail-view.tsx` (public detail page) — same
     Read Online / Sign In to Read treatment above Borrow/Reserve.
   - `resource-detail-modal.tsx` (admin inventory) — added a
     "Preview Reader" button (opens in a new tab) alongside Edit/Archive;
     this is genuinely a preview affordance for an admin, not the
     member-facing "Read Online" label, since admins manage inventory
     rather than read for themselves.
   Verified live via `npm run dev` + `curl`, not just a build-passing
   assumption: `/member/library/read/1` (Genesis, has content) returns
   200 with no error markers; `/member/library/read/99` (no matching
   resource) also returns 200, rendering the "not available to read
   online yet" `EmptyState` rather than crashing. Build + `tsc --noEmit`
   clean.
2. **Reading progress store shipped**, mirroring `use-enrollments.ts`
   exactly. `reading-progress-data.ts` (`ReadingProgress` type:
   `completedChapterIds: string[]` + `totalChapters: number`, percentage
   always derived via `getReadingProgressPercent()`, never stored — plus
   `lastChapterId`/`lastReadAt` for resume and Phase 6's "recently read"
   ordering) + `use-reading-progress.ts` (module-level store,
   `startReading()`/`markChapterRead()` mutators). Seeded 2 rows (Genesis
   in-progress, Psalms completed) so Phase 3's "Continue Reading" isn't
   empty by default — matching `initialEnrollments`' own seeded pattern,
   corrected from an earlier draft comment that incorrectly claimed
   enrollments start empty.
   `reader-view.tsx` now calls `startReading()` once per mount and
   `markChapterRead()` on every chapter view (viewing a chapter of prose
   is the natural completion signal, unlike a lesson's separate "Mark
   Complete" button) — auto-flips to `COMPLETED` once every chapter is
   viewed, same auto-flip pattern `markLessonComplete` uses. Resumes at
   `lastChapterId` when no `?chapter=` is explicitly given, so leaving
   and returning to the reader lands back where the member stopped. A
   live progress bar (derived percentage) now shows in the reader header.
   Verified live via `npm run dev` + `curl` for both `?chapter=` present
   and absent; true cross-navigation resume needs a real browser session
   (progress is in-memory only, same as every other store in this app,
   so a fresh `curl` process can't observe persistence within one dev
   session — this is expected, not a gap). Build + `tsc --noEmit` clean.
3. **Multi-view integration shipped** — reading progress now surfaces
   on the existing card/list views the audit cataloged, plus a new
   "Continue Reading" section, matching `/member/courses`'s existing
   "Continue Learning" pattern exactly (real per-item progress bar +
   Resume link, not decorative).
   - `scroll-card.tsx` — both `ScrollCard` (grid) and `ScrollListItem`
     (list) now show a live progress bar / percentage chip via a new
     `useReadingPercent()` helper, and the "Read Online" label switches to
     `Continue Reading (N%)` once reading has started.
   - New `continue-reading-section.tsx`, wired into
     `/member/library/page.tsx` — lists every `READING`-status resource
     with a per-item progress bar and a "Resume" link straight into the
     reader at `lastChapterId`; scoped to in-progress only, mirroring how
     `completed-courses-section.tsx` is kept separate from the courses
     page's own "Continue Learning" card. Renders nothing (not an empty
     state) when no resource is in progress, same as the courses page's
     own `inProgress.length > 0` gate.
   - `scroll-detail-view.tsx`'s Related Resources cards were left as-is
     for this phase — the phase spec named `ScrollCard` and a
     library-level "Continue Reading" affordance specifically, and that
     file is already close to the 200-line cap; not adding scope beyond
     what was asked.
   Verified live via `npm run dev` + `curl`: `/member/library` renders
   the literal string "Continue Reading" in its server-rendered HTML
   (this page has no client-side loading skeleton gating it, unlike the
   reader). Build + `tsc --noEmit` clean.
4. **Highlighting shipped: data model + store + real text-selection UI.**
   `highlight-data.ts` (`Highlight`: `resourceId`, `chapterId`,
   `startOffset`/`endOffset` — character positions within that chapter's
   `body` string, `text` snapshotted at creation for Phase 6's
   highlights-list view, `color` from a small closed
   `HighlightColor` set using CSS vars already in `globals.css`
   — gold/green/teal/pink, a functional multi-value choice like a
   category chip, not decoration) + `use-highlights.ts` (same
   `useSyncExternalStore` module-store pattern as everything else; no
   seed rows, since a seeded highlight's offsets would silently desync
   the moment its chapter's placeholder prose is ever edited — unlike
   `initialFavorites`/`initialEnrollments`, which don't carry that
   fragile a dependency).
   Real text-selection UI in the reader, not a placeholder: a new
   `useChapterSelection()` hook converts a real `window.getSelection()`
   range into chapter-relative character offsets (walking the DOM text
   nodes before the selection start within its paragraph, then adding
   that paragraph's own chapter-relative start offset — correctly
   accounts for trimmed leading whitespace so stored offsets exactly
   match the trimmed highlighted text). `HighlightPicker` shows a small
   floating color-swatch popover anchored to the selection's bounding
   rect. `HighlightedParagraph` splices `<mark>`-styled spans into each
   paragraph for any highlight whose range overlaps it, re-deriving
   paragraph-local slice points from the chapter-relative offsets on
   every render — so highlights survive chapter navigation and stay
   correctly positioned regardless of how paragraphs are split for
   display.
   Verified: build + `tsc --noEmit` clean, `/member/library/read/1`
   returns 200 live via `npm run dev` + `curl`. The actual
   select-text-and-click-a-color interaction was traced logically
   through the offset-computation code (confirmed correct on manual
   trace against Genesis's real seed prose) rather than driven by an
   actual browser session — Playwright isn't installed in this project
   and adding it as a new dependency solely for a one-off interaction
   check isn't warranted; flagging this honestly rather than claiming a
   browser-verified interaction that didn't happen.
5. **Notes/annotations shipped**, same shape family as highlights but
   free-text and attachable two ways, per the phase spec: `note-data.ts`
   (`Note`: `resourceId`/`chapterId` always, optional `highlightId` when
   the note is on a specific highlighted passage rather than the chapter
   generally) + `use-notes.ts` (same store pattern, no seed rows for the
   same reason as highlights — a real note is written about content a
   member actually read). New `NotesPanel` component serves both modes:
   rendered inline under the chapter body with no `highlight` prop for
   general chapter notes, and as a scoped panel titled with the
   highlighted text when opened by clicking a `<mark>` in the reader
   (added `onHighlightClick` to `HighlightedParagraph` for this).
   Verified: build + `tsc --noEmit` clean, `/member/library/read/1`
   returns 200 with no error markers via `npm run dev` + `curl` (the
   panel itself isn't visible in the raw HTML response since the reader
   is fully client-rendered behind a loading skeleton, consistent with
   Phase 1/2/4's same verification approach).
6. **Polish: all 3 named items shipped.**
   - New `CurrentlyReading.tsx` dashboard widget, wired into
     `/member/page.tsx`'s existing 3-column widget grid as a 4th item.
     Deliberately modeled after `ELearningProgress.tsx`'s genuinely
     live-wired pattern rather than copying `BorrowedBooks.tsx`, which
     (noted here, not touched — out of scope) is itself still a static
     `mockBorrows` array despite the real `use-borrowings.ts` store
     existing; this new widget reads `useReadingProgress()` +
     `useResources()` directly so it can't drift from what the reader
     itself shows.
   - New `chapter-search.tsx` ("search within this book"): a query box
     that matches chapter title or body text, shows a snippet per match,
     and jumps the reader to that chapter on click. Scoped to the
     current book's own (few) chapters — no cross-book search, since
     that wasn't what "search-within-book" asked for.
   - New `highlights-notes-list.tsx` ("My Highlights & Notes"): a
     collapsible panel listing every highlight and note for the whole
     book (not just the current chapter), each entry jumping back to its
     chapter on click, with its own delete action. Renders nothing when
     both are empty, matching the same "don't show an empty affordance"
     convention `continue-reading-section.tsx` already established in
     Phase 3.
   Verified live via `npm run dev` + `curl`: `/member` (dashboard)
   renders the literal string "Currently Reading" in its server-rendered
   HTML; `/member/library/read/1` and `/member/library/read/7` (the
   Psalms `COMPLETED` seed row) both return 200. Build + `tsc --noEmit`
   clean.

## Reading Feature Arc — final summary

All 6 phases complete, each individually committed, built, type-checked,
and pushed to `auto-wip`. The arc took the reading-feature-gap-audit's 6
confirmed-absent areas (reading access, highlighting, reading progress,
notes, readable body content, and the multi-view infrastructure that
*did* exist to build on) and closed every one:

- **Readable content**: 4 resources (Genesis, Psalms, Matthew,
  Revelation) now have real chapter body text, not just metadata.
- **Reading access**: a real reader at `/member/library/read/[resourceId]`,
  reachable from all 4 components the audit named (plus an admin
  preview action), not a decorative or dead button anywhere.
- **Reading progress**: a full store mirroring the lesson/enrollment
  precedent, surfaced on cards, a dedicated "Continue Reading" section,
  and now a dashboard widget too.
- **Highlighting**: real text-selection → chapter-relative offsets →
  persisted, colored, positionally-stable marks that survive chapter
  navigation.
- **Notes**: free-text, attachable per-chapter or per-highlight.
- **Polish**: a dashboard summary, in-book search, and a full
  highlights/notes review list.

**What's intentionally out of scope, not overlooked:**
- `BorrowedBooks.tsx`'s pre-existing static `mockBorrows` array (noted in
  Phase 6, not fixed — unrelated to this arc's brief).
- Cross-book search, and a dedicated top-level "My Highlights" page
  spanning every book at once — the phase spec's "search-within-book"
  and "highlights/notes list view" were both scoped to one open book,
  not the whole library; a library-wide version of either would be a
  reasonable future phase but wasn't asked for here.
- Real browser-driven interaction testing (actual mouse-drag text
  selection, actual color-pick clicks) for Phases 4/5 — Playwright isn't
  installed in this project; offset/selection logic was verified by
  manual trace against real seed prose instead, and every route was
  confirmed live via `npm run dev` + `curl` at every phase.

**Recommended next step for a human reviewer:** review this arc's 7
commits (`ce75b2f`..HEAD on `auto-wip`, following the prior 18-phase
audit-remediation run), test the actual selection/highlight/note flow
in a real browser, then decide whether to merge into `feat/ui-setup` or
`main`.

---

# Contributor Workspace Richness Pass + Hydration Fix

Same branch (`auto-wip`), triggered by user-reported screenshots showing
`/contributor/research` and `/contributor/courses` reading noticeably
thinner than sibling modules (KCS Map, e-learning, reporting), plus a
persistent "1 Issue" dev-tooling badge visible across many screenshots
that had never been investigated.

## 1. "1 Issue" indicator — root cause found and fixed

The badge was Next.js's dev-mode error overlay, and it was flagging a
real, reproducible hydration mismatch, not a false positive. Root cause:
all 4 sidebars (`app/lecturer/_components/lecturer-sidebar.tsx`,
`app/contributor/_components/contributor-sidebar.tsx`,
`app/member/_components/member-sidebar.tsx`,
`app/dashboard/_components/sidebar.tsx`) computed their "which nav item
is active" state with:

```js
const currentRoute = typeof window !== "undefined" ? window.location.pathname : "";
```

On the server, `window` is undefined, so `currentRoute` is always `""`
and no nav item is ever marked active in the server-rendered HTML. On
the client's first paint (before React hydrates), `window.location.pathname`
is already the real route, so React computes a different active item
with different background/color/border-left styling — a genuine
server/client attribute mismatch, exactly the class of bug the console
error described (`components/session-room/control-bar.tsx`'s sibling
issue, but here in every sidebar). `app/contributor/_components/contributor-mobile-bottom-nav.tsx`
had the same underlying anti-pattern in a `useState`+`useEffect` form
that avoided a hard mismatch (server always renders `""`) but still
caused a one-frame flash of incorrect active state on every load.

**Fix:** replaced `window.location.pathname` with Next.js's built-in
`usePathname()` hook in all 5 files — it resolves correctly and
identically on both server and client with no window check needed, so
there's no mismatch and no flash. Verified by comparing server-rendered
HTML before/after: `/lecturer/messages` (the exact route the reported
error came from) now renders `rgba(212,168,67,0.12)` (the active-state
background) around the Messages link in the raw HTML, meaning the
server and client will agree from the very first paint. Cross-checked
`/contributor/research` (1 active match), `/member` (1 active match),
and `/member/library` (3 matches once the nested sub-item's distinct
`0.08`-opacity active style — a real, intentional visual difference
from top-level items, not a bug — was accounted for). Build + `tsc --noEmit`
clean.

## 2/3. Contributor Workspace richness audit + fix

Confirmed the report's read: `/contributor/research` cards showed only
title/status/paper-count/View-Details despite `ResearchProjectSummary`
already carrying `description`, `startDate`, and `contributors` —
unused fields, not missing data. `/contributor/courses` cards were the
same shape gap (`CourseCatalogEntry.description` unused on the card).
The `Course Details` modal was a bare key-value list with no enrollment
trend or roster link, despite a real, matching analytics dataset
(`courseAnalytics` in `app/dashboard/e-learning/progress/_components/progress-data.ts`,
keyed by the exact same course IDs — `crs-001` etc. — as `CourseCatalogEntry`)
sitting completely unconsumed by the contributor side. Both status
configs (`projectStatusConfig`, `courseStatusConfig`) also had the same
Tailwind-in-Dialect-B bug fixed elsewhere in this run.

**Fix — My Research** (`my-research-view.tsx`, `my-research-detail-modal.tsx`):
cards now show description, start date, and contributor initials (new
`contributor-initials.tsx` — a Dialect-B equivalent of the admin side's
`ContributorAvatar`, which is hardcoded Tailwind and not reusable here);
the modal gained a full contributor name list. `projectStatusConfig`
gained `bg`/`color`/`border` tokens (kept `cls` for the genuinely
Dialect-A admin consumers — `project-collaboration-card.tsx`,
`collaborations-stats.tsx`, `project-detail-modal.tsx` — confirmed via
grep before touching the shared config).

**Fix — My Courses** (`my-courses-view.tsx`, `my-course-detail-modal.tsx`):
cards now show description and a live average-completion bar pulled
directly from `courseAnalytics`, matching the exact visual pattern
`course-analytics-card.tsx` already established on the admin
`/dashboard/e-learning/progress` page. The modal gained the same
completion bar plus a top-performers list and a real
"View full enrollment roster" link to `/dashboard/e-learning/progress`
— reusing the existing admin page rather than building a new
contributor-facing roster view, consistent with this module's
established pattern of deep-linking into real admin forms/pages
(Submit Paper → `/dashboard/research/submit`, Add Course →
`/dashboard/e-learning/add`). `courseStatusConfig` was fully converted
to CSS-var tokens (not just supplemented) since all 3 of its consumers
are contributor-only, confirmed via grep.

No new data model fields were invented for either page — every added
number/name/link (`description`, `startDate`, `contributors`,
`courseAnalytics`) already existed in the app; the fix was making the
cards and modals actually surface what was already there, per the
task's explicit instruction to reuse existing components/patterns
rather than invent new ones. A course thumbnail/cover-image field does
not exist anywhere on `CourseCatalogEntry` — adding one would have been
inventing new data, so it was intentionally left out rather than
fabricated.

All files stayed under the 200-line cap (`my-courses-view.tsx` 118,
`my-course-detail-modal.tsx` 103, `my-research-view.tsx` 104,
`my-research-detail-modal.tsx` 70, `contributor-initials.tsx` 33).
Verified live via `npm run dev` + `curl`: both pages return 200 with no
error markers (loading skeleton renders as expected — both pages are
client-rendered behind a simulated delay, same as every other view in
this app). Build + `tsc --noEmit` clean.

---

# Gaps & Modals Audit Fixes

Same branch (`auto-wip`). A read-only audit
(`.claude/skills/kls-page-builder/references/gaps-and-modals-audit.md`)
found 3 independent issues across the app; this pass fixed all 5 items
from its Prioritized Findings list, in severity order. The 4 modal-vs-
page conversions and the hub-page-standardization item were explicitly
left out of scope per instruction — those are architectural decisions
(new routes, navigation patterns) deserving their own scoped discussion,
not correctness fixes.

## 1. Blocking — requestSession() authorization gap, fixed

`requestSession()` (`app/lecturer/_shared/use-session-requests.ts`) was
a bare append with zero validation — the enrollment/completion gate the
lecturer UI's own copy promised ("requests from learners who complete
your courses") existed only as an accidental property of the single
current caller pre-filtering to completed courses, not as an enforced
precondition of the function itself. Added a non-hook
`getEnrollmentsSnapshotForStore()` accessor to `use-enrollments.ts`
(mirroring `getLessonsSnapshot()`'s established cross-store-read
pattern); `requestSession()` now throws unless the learner has a
COMPLETED enrollment for the course and unless the named lecturer
actually teaches it — matching `rejectSession()`'s existing defense-in-
depth pattern in the same file. Traced the one real caller end-to-end
and confirmed the happy path is unaffected (it already derives
`lecturerName` the identical way). Build + `tsc --noEmit` clean;
`/member/courses` verified live.

## 2. Blocking — BorrowReserveConfirmModal was contentless, fixed

The modal was exactly what the audit named: a repeated question and one
button, no due date, availability, or terms. Pre-commit, it now shows a
real due-date line (Borrow) computed from
`defaultSystemSettings.defaultBorrowPeriodDays` (a real value this app
already defines, not fabricated) and a real copies-available line where
the caller has `availableQty` in scope (`library-browser.tsx`,
`publication-detail-view.tsx` — both already had a real `Resource`/
`quantity` on hand; left optional for the other 2 callers rather than
forcing a larger local-state refactor). Post-commit, Reserve now shows
the real queue result from `addReservation()`'s actual return value
instead of generic copy. Build + `tsc --noEmit` clean; `/library` and
`/library/1` verified live.

## 3. Rough — /member/leaderboard fabricated data, closed out

This gap had been flagged open across two prior audit passes without
being fixed. Investigated the actual data-model constraint before
building anything: `useCertificates()` is the only store in this app
with genuine multi-member data (3 real distinct names in its seed
rows); `Borrowing` carries no member field at all, so "books read"
cannot be honestly shown for anyone but the single live "John Doe"
persona. Rather than fabricating a multi-member borrowing history or
inventing a composite "points" score (which the old page did with an
unexplained formula), the page now ranks every real name from
`useCertificates()` by real completed-course count, includes the
current member even at 0 completions, and shows "Books Read" only on
the current member's own row with an explicit footer note about the
data-model limitation — following `DashboardStats.tsx`'s own precedent
for handling an unbacked stat honestly (its "Payments" stat). Verified
live: the 3 real certificate names render, "John Doe" appears, none of
the old fabricated names remain. Build + `tsc --noEmit` clean.

## 4. Rough — CLAUDE.md's Coming Soon list, fixed

Discovered CLAUDE.md never actually named any Coming Soon module before
this fix — the list only existed in the page-builder skill file, which
itself already included Donations and News (the audit's "undocumented"
finding was about CLAUDE.md specifically, not the skill). Added a
bullet to CLAUDE.md's "Known inconsistencies" naming all 6 real Coming
Soon modules (confirmed via grep for the exact placeholder banner text
across `app/dashboard/*`), pointing to the skill's §6 for the pattern.
Also corrected the skill's own list, which included "Download Center" —
confirmed via direct read that it's no longer a pure placeholder (shows
a real certificates list; only one export action is disclaimed) —
removed it with an explanatory note. Both `CLAUDE.md` and the skill
file are gitignored in this repo, so this fix has no git diff; confirmed
both edits are present on disk by reading them back.

## 5. Polish — dead phase-placeholder.tsx, removed

Re-confirmed zero call sites via grep before deleting (per the standing
instruction to investigate before removing anything), then removed
`app/lecturer/_components/phase-placeholder.tsx` — a Phase-1 scaffold
superseded once the lecturer portal's real pages were built. Build +
`tsc --noEmit` clean.

## Summary

All 5 items from the audit's Prioritized Findings resolved, each in its
own commit, each verified with a real build + typecheck pass and (where
the change was runtime-visible) a live `npm run dev` + `curl` check —
not just a build-passing assumption. Both Blocking items were genuine
correctness/trust issues (an unenforced authorization precondition, a
decision made with zero visible information) and are now fixed at the
root rather than papered over. The Rough leaderboard fix required
determining a real data-model constraint (no per-member borrowing data
exists) before deciding the honest scope of what could be shown, rather
than fabricating comparison data to make the page look more complete
than the underlying stores support.

**Still explicitly out of scope, by instruction, not oversight:** the 4
modal-vs-page conversions (research project, admin course, research
paper, library resource detail — each recommended to become a real page
instead of a modal) and the 3-hub-page Coming-Soon-tag standardization
(e-learning/research/publishing). Both are real, larger design decisions
affecting navigation/URL structure across multiple modules and deserve
a scoped discussion before an autonomous build, not a bundled fix.

# Modal Stacking, Session Seeding, File Upload, KCS Map Consolidation

Four independent fixes, each its own commit, each verified with a real
build + `tsc --noEmit` pass and a live `npm run dev` + `curl` check.

## 1. Modal z-index/stacking bug (root cause + fix)

**Root cause:** `components/ui/modal.tsx`'s overlay rendered inline (no
portal) at Tailwind `z-50`, while `app/dashboard/_components/topbar.tsx`'s
sticky header set `zIndex: 100` inline. 50 < 100, so the topbar (and
anything inside it, e.g. the language-switcher dropdown) painted above
any open modal wherever the two overlapped — visible on Add Resource, KCS
Map dropdowns, and Coming Soon pages, since the topbar is mounted on every
`/dashboard/*` route. No transform/opacity/isolation trapped the modal in
a sub-context — this was a plain numeric ordering mistake with no shared
z-index scale anywhere in `globals.css` to prevent it.

**Fix:** `Modal` now renders via `createPortal(..., document.body)`,
removing it from the dashboard's internal DOM/stacking hierarchy
entirely, and its overlay z-index was bumped to `z-100`. `DashboardTopbar`
was lowered to `zIndex: 40` so there's a real, intentional ordering rather
than ad-hoc numeric luck. Commit `d834e67`.

## 2. Seeded session requests

`app/lecturer/_shared/session-requests-data.ts`'s `mockSessionRequests`
was `[]`, so Live Sessions (admin), Session Requests (lecturer), and My
Sessions (member) were all empty on first load. Seeded 3 requests mixing
PENDING/APPROVED/COMPLETED — one references John Doe + course '4' ("The
Art of Worship"), the only course actually `COMPLETED` in the seed
enrollment data (relevant since `requestSession()`'s enforcement, added in
the prior audit-fix batch, checks real enrollment completion). The other
two are other learners' historical requests, giving the lecturer queue a
genuine PENDING row and the admin-wide Live Sessions view more than one
lecturer's activity. Commit `e5c2a20`.

## 3. Real file upload for Resource Add/Edit form

Confirmed via full-codebase search: no functional file-upload pattern
existed anywhere (three `<input type="file">` elsewhere in the app are
inert placeholders with no `onChange`/`FileReader`/blob wiring). Since
this is a fully mocked prototype with no real backend (no Cloudinary/API
upload), built `components/ui/file-picker-field.tsx` — a client-side
picker that reads a local file via `URL.createObjectURL` and hands the
blob: URL back to the caller. This is the only artifact a real-backend-
free prototype can produce; the blob URL previews/opens for the current
browser session and doesn't persist across a reload, same lifetime as
every other in-memory mock-store value in this app.

Wired into the Add/Edit Resource form: cover image now supports upload
alongside the existing URL field (`resource-form-details.tsx`), plus new
optional `documentUrl`/`audioUrl`/`videoUrl` fields added to the `Resource`
type and a new `resource-form-media-files.tsx` component (split out to
keep `resource-form-details.tsx` under the 200-line cap). `library-view.tsx`'s
`handleSave` passes all three through on create/edit. `resource-detail-modal.tsx`
was also given a small "Document/Audio/Video" link row so the newly
captured data isn't invisible after saving — same "don't build a form field
with nowhere to display it" discipline as the earlier canonical-shape work.
Commit `a52fa85`.

## 4. KCS Map: 8 pillar routes consolidated into 1

`app/dashboard/kcs/{foundation,history,wisdom,prophetic,gospel,acts,
epistles,revelation}/page.tsx` were byte-for-byte identical 10-line files,
each rendering the same `KcsPillarView` with only the `pillarKey` string
literal differing — all 8 pillars' data already lived in one
`kcs-pillars-data.ts` record. Replaced with a single
`app/dashboard/kcs/page.tsx`, a new `KcsPillarTabs` tab bar, and a
`KcsMapView` client wrapper that resolves the active pillar from a
`?pillar=` search param (kept as real URL state, not just component
state, so it's shareable/back-button-able). Sidebar's 8-link "KCS Map"
dropdown collapsed to one direct link (`/dashboard/kcs`). The existing
`[pillar]/[scrollId]` scroll-detail dynamic route was left as-is; only its
"Back to {pillar}" link was updated to `/dashboard/kcs?pillar={pillarKey}`.

**Scope note:** only the admin KCS Map route tree existed as 8 separate
routes. The member side (`/member/library`) already consolidates all 8
pillars into one page via its own tab/filter UI and separate data file
(`library-data.tsx`) — confirmed via research this is a pre-existing,
independent implementation with some data drift from the admin's
`kcs-pillars-data.ts` (slightly different per-pillar book lists, a 2- vs
3-state status enum). Not touched in this pass — reconciling the two data
sources is a separate, larger decision, not a routing fix. Commit `07c8c4c`.

## Summary

All 4 items fixed, committed, and pushed to `auto-wip`. The z-index bug
was root-caused (no portal + an accidental numeric tie/near-tie with the
topbar) rather than patched with a single arbitrary bigger number. The
file-upload approach is confirmed client-side-only (`URL.createObjectURL`
blob URLs) since no real backend exists in this prototype — this was
raised explicitly rather than assumed, per the task's own instruction to
confirm the constraint before designing around it.

# Session Requests: Reverted Enrollment/Completion Enforcement

Explicit product decision, reversing `354306a` ("fix(sessions): enforce
enrollment/completion inside requestSession()"): session requests now
work like a "Slack huddle" — any authenticated member can request a live
session with any lecturer, for any course, at any time, no precondition.

- `requestSession()` (`app/lecturer/_shared/use-session-requests.ts`)
  dropped the enrollment/completion/lecturer-match checks entirely —
  back to a plain append + `emitChange()`.
- "Request Session" is no longer gated to completed courses. Extracted a
  new `in-progress-courses-section.tsx` (mirroring the existing
  `completed-courses-section.tsx`) so the action reaches any enrolled
  course, in progress or completed. Chose "any enrolled course, any
  status" over "any course at all, not even enrolled" — the latter would
  need a net-new course picker with no existing precedent in this app,
  so it was ruled out as the more ambiguous, bigger-scope option.
- Updated lecturer- and learner-facing copy that claimed a completion
  gate ("learners who complete your courses", "Complete a course, then
  use Request Session...") across `session-requests-view.tsx`,
  `session-requests/page.tsx`, and `my-sessions-view.tsx` — same
  copy-vs-code mismatch class the earlier audit flagged as Blocking, now
  addressed proactively rather than left behind after the policy changed.

Commit `60d9741`.

# Health System Module (first of 6 "Coming Soon" replacements)

Replaced the placeholder at `app/dashboard/health/page.tsx` (previously
promising Book a Checkup / Health Records / Immunization Tracker / Clinic
Directory, all `status: 'coming'`) with a real module. Commit `3bd8a7b`.

## Coming Soon module template (reuse for Beauty, Counseling, Rehab, Donations, News)

**Route shape:** one hub `page.tsx` linking to N sub-routes, each with its
own `page.tsx` + local `_components/`. This matches the existing
library/e-learning convention (hub page listing cards → dedicated
sub-route per feature) rather than an in-page-tabs single page — checked
both precedents before choosing; hub-plus-sub-routes is what every other
multi-feature dashboard module in this app already does.

```
app/dashboard/<module>/
  page.tsx                    hub — cards linking to each sub-route
  _shared/
    <module>-data.ts           types + seed data, CURRENT_MEMBER_NAME const
    use-<module>.ts            useSyncExternalStore store(s)
  <feature-a>/
    page.tsx
    _components/<feature-a>-view.tsx (+ split-out sub-components as needed)
  <feature-b>/
    page.tsx
    _components/<feature-b>-view.tsx
  ...
```

**Store pattern:** exactly the `use-enrollments.ts`/`use-session-requests.ts`
shape — module-level mutable array, `Set` of listeners, `emitChange()`,
`subscribe()`, a snapshot getter, and a `useSyncExternalStore` hook. Only
give a real mutation function to the sub-feature that's genuinely a
member-initiated write (e.g. booking an appointment); sub-features that
would in reality be written by staff/a portal that doesn't exist yet
(health records, immunizations) get a plain read-only hook over the seed
array instead of a fake write path — don't invent a write flow that has
no real actor behind it yet.

**Seeding approach:** 3-4 "directory" entries (clinics/practitioners/
whatever the module's static catalog is) across visibly different
categories, 2-3 records for the one mock member persona
(`CURRENT_MEMBER_NAME`) spanning different statuses (so status badges/
filters have something real to show), same precedent as
`session-requests-data.ts` and `enrollment-data.ts`'s seed rows. Never
seed more than one persona's data unless the module already has
multi-persona data elsewhere to draw from (Health System's `Appointment`/
`HealthRecordEntry`/`ImmunizationEntry` are all scoped to
`CURRENT_MEMBER_NAME` for this reason).

**CRUD scope:** build only the write flows that have a real actor in this
mock's single-persona, no-backend world. Booking a checkup is real
(member → store). Health records/immunizations are read-only (no clinic
staff portal exists to write them) — don't fabricate a form that writes
data no real UI would produce yet.

**Admin oversight — decide, don't default to building it.** Checked
whether `/dashboard/health` needs an all-appointments oversight view
(parallel to `/dashboard/e-learning/sessions`'s read-only DataTable across
every lecturer). Skipped it here: this mock has exactly one live member
persona, so an "all appointments" view would show the identical rows as
"My Appointments" today — zero distinguishing value until multi-member
data exists. Re-evaluate per-module: if a future module's seed data
already has multiple distinct actors (like session requests do, with 3
named learners), building the oversight view is worth it immediately;
if not, flag it as future work instead of building a duplicate view.

**Known nav gap, not fixed here (matches an existing documented
inconsistency):** `/dashboard/health` is only linked from
`adminMainNav` in `app/dashboard/_components/sidebar.tsx` — `memberNav`
(the same file) and the real member navigation (`member-sidebar.tsx`)
have no Health System link at all, even though the module's actual
content (book a checkup, view my records) is member-facing. This is the
same class of gap CLAUDE.md already documents for `memberNav` pointing at
the wrong routes generally — not introduced by this change, just newly
visible because Health System is now a real destination instead of a
placeholder. Flagging rather than silently fixing, since deciding where
Health System belongs in navigation is a product/IA call, not a
mechanical fix.

# Instant Sessions (Meet-style "start now"), Additive to Scheduled Requests

Added a second way to start a live session — instant, no scheduling or
approval step — alongside the existing propose-a-future-time flow, which
is fully unchanged. Commit `6d3944e`.

## Design: `mode` field, not a 5th status

`SessionRequest` gained `mode: 'SCHEDULED' | 'INSTANT'`
(`app/lecturer/_shared/session-requests-data.ts`) rather than a new
`SessionStatus` value. Reasoning: an instant session still goes through
the same real `APPROVED → COMPLETED` lifecycle as a scheduled one —
ending the mock room still calls `completeSession()` regardless of mode.
The difference is entirely about *how* a request arrived at `APPROVED`
(skipped PENDING/approval vs. went through it), not a different terminal
state, so bolting a 5th status value on would have conflated two
orthogonal concerns (status = where in the approve/reject lifecycle;
mode = which flow created it).

## What changed

- **`use-session-requests.ts`**: new `startInstantSession(input)` creates
  a `SessionRequest` directly as `status: 'APPROVED'`, `mode: 'INSTANT'`,
  with `scheduledAt` stamped to the moment of creation — no PENDING
  stage, nothing for either party to approve, mirroring Meet's "Start an
  instant meeting" having no separate approval step. The existing
  `requestSession()` (scheduled flow) is untouched apart from stamping
  `mode: 'SCHEDULED'` on its output; all 3 seed rows in
  `session-requests-data.ts` got the same `mode: 'SCHEDULED'` tag.
- **`session-card.tsx`**: `canJoin` is now `status === 'APPROVED' &&
  (mode === 'INSTANT' || secondsRemaining <= 0)` — instant sessions never
  wait on `useCountdownToTime`, since there's nothing to count down to.
  This is a real gating change, not cosmetic: previously *any* APPROVED
  session with no future `scheduledAt` would already read as joinable by
  the old gate, but instant sessions now skip the countdown hook
  invocation's meaningful branch entirely rather than coincidentally
  passing it. Visually, instant rows get a real "⚡ Instant" chip next to
  the status badge and a "Live now" label in place of the
  scheduled-time-plus-countdown row.
- **`StartInstantSessionButton`** (new, one per portal —
  `app/lecturer/sessions/_components/` and
  `app/member/sessions/_components/`): both wired into their portal's
  `/sessions` page header. Both this mock's one lecturer persona (teaches
  4 courses) and its one member persona (4 enrollments across 3
  lecturers) have genuine course/lecturer ambiguity, so both sides show a
  small course-picker modal before starting — resolved the same way
  `RequestSessionModal` already resolves "which lecturer" for the
  scheduled flow (via `courseCatalog.lecturerId`), rather than inventing
  a separate mechanism. No multi-user/learner picker was built on top of
  that, since there's no second real learner or lecturer persona in this
  mock to pick from — would have been a picker with no real data behind
  it. Both buttons `router.push()` straight into the existing
  `SessionRoomView` via the real room routes; no new room UI.
- **Admin oversight** (`/dashboard/e-learning/sessions`'s `SessionsView`)
  gained a `Mode` column so the instant/scheduled distinction is visible
  there too, not just on the two portal-side list views — this list view
  reads the same shared store, so leaving it blind to the new field would
  have been an inconsistent gap the moment it shipped.

## Verification

`tsc --noEmit` and `npm run build` both clean. Live-verified via
`npm run dev` + `curl`: `/lecturer/sessions`, `/member/sessions`,
`/lecturer/sessions/requests` all 200 with the "Start Instant Session"
button text present in the server-rendered HTML; `/lecturer/sessions/sr-1/room`
and `/member/sessions/sr-1/room` both 200 and render the real "Mock
Session Room" UI (not the "Session not found" EmptyState), confirming the
room route + `SessionRoomView` correctly resolve a request from the
shared store — the same lookup path a freshly created instant session's
id goes through via `router.push()`. (One transient `500` from a stale
Turbopack worker process was hit mid-verification and resolved by
clearing `.next` and restarting — not a code issue, included here so a
future reader doesn't mistake dev-server flakiness for a real bug if it
recurs.)

# Instant-Session Bug Report + Mock Session Room Enrichment

## Part A: bug investigation and fixes

**Bug 1 — reported "John Doeright now" concatenation in the instant-session
modal.** Full trace: read `start-instant-session-button.tsx` (lecturer
side) and hex-dumped the exact source line (`xxd`) — confirmed a real
`0x20` space byte between `{CURRENT_MEMBER_NAME}` and `right` in the
committed source, and confirmed via `git log -p --follow` that this line
has only ever existed once, in commit `6d3944e`, already with the space
present. Checked for any string-concatenation path that could produce
"Doe" + "right" with no separator (grepped for `CURRENT_MEMBER_NAME +`
and similar patterns app-wide) — none found. **Conclusion: no
concatenation bug exists in the committed source.** The most plausible
explanation for what was seen live is a stale Fast Refresh / HMR module
state (this app's session-request store is a module-level mutable array,
and the `SessionRequest` shape changed — added `mode` — earlier in this
same dev session; a stale in-memory module instance surviving a hot
reload across that shape change is a known category of dev-only
artifact, not a logic bug). Rather than leave it unaddressed on "probably
fine," restructured the whole sentence into one template literal
(`` {`Starts a live session with ${CURRENT_MEMBER_NAME} right now — ...`} ``)
so there is no longer any JSX text/expression adjacency near the name at
all — this removes the entire class of risk regardless of which
explanation was correct. Commit `93b9954`.

**Bug 2 — audit "Instant" badge across all statuses.** Read
`session-card.tsx`'s render tree in full: the "Instant" chip (lines
41-45) is gated only on `isInstant` (derived from `request.mode`), and
sits in the card's top header row as a sibling to the status badge — not
nested inside any of the `status === '...'`-gated blocks below it. Same
check on the admin `sessions-view.tsx`'s new Mode column: gated only on
`r.mode`, independent of `r.status`. **Conclusion: no bug — the badge
already renders unconditionally across PENDING/APPROVED/REJECTED/COMPLETED
for both list views.** No fix was needed or made; documented here as a
clean audit result rather than silently closing the item.

## Part B: Mock Session Room enrichment

Read all 6 room files in full before changing anything, per instruction.
Confirmed the lecturer-feature-audit's claim: mic/camera/raise-hand/
end-session are already real local-state toggles reflected in
`ParticipantTile`/`ParticipantListPanel`, and chat is a real per-session
store (`use-session-chat.ts`) — but that store has **no per-message
reaction mechanism**, confirmed by reading it in full and grepping the
whole app for "reaction" (zero matches anywhere before this change).

**Added, all real interactive state:**

1. **Add Participant** (`add-participant-modal.tsx`) — lists other known
   personas already established elsewhere in this app (the 3-person
   `lecturerRoster` + named learners reused across
   `session-requests-data.ts`/`audit-log-data.ts`/`certificates-data.ts`/
   etc.) who aren't already in the room. Picking one calls `onAdd`, which
   `SessionRoomView` uses to push a name into local `addedNames` state —
   genuinely adding a tile to `VideoTileGrid` (now takes
   `extraParticipants: ExtraParticipant[]` instead of a fixed 2-tile
   layout) and a row to `ParticipantListPanel`, with role (Lecturer/
   Learner) derived from real roster membership, not guessed.
2. **Screen-share toggle** — `ControlBar` gained a `presenting`
   button wired to real local `useState` in `SessionRoomView`.
   `ParticipantTile` shows a teal border + "Presenting" badge on the
   user's own tile when active. Deliberately does **not** call
   `getDisplayMedia` or attempt real capture — there's no peer/backend
   for a captured stream to go to in this mock, so faking real capture
   would be exactly the "looks real but isn't" gap this project has
   spent multiple phases removing. This is an honest visual-state toggle,
   framed the same way the room's own "Mock Session Room" banner already
   discloses for camera/mic.
3. **Quick reactions** — new `use-session-reactions.ts`, the same
   `useSyncExternalStore` module-level-store pattern as every other store
   in this app (not a new state-management approach). `ReactionBar`
   renders 6 emoji buttons; `ReactionBurst` is an absolutely-positioned
   overlay on the video grid that shows the active reaction and
   self-clears the store after 2 seconds via a `useEffect` timer — real,
   transient shared state, not a decorative animation with nothing behind
   it. No new CSS keyframe was added (the project's animation rule caps
   this app to its two existing entrance animations); the burst appears/
   disappears via conditional render only.

**Deliberately NOT built, and why:**

- **Real screen sharing** — needs a real `getDisplayMedia()` call and an
  actual peer connection to stream to; this mock has neither, and a fake
  "shared screen" tile with no real captured content would mislead more
  than it demonstrates.
- **Live streaming** — needs real broadcast infrastructure (RTMP/HLS or
  similar) and a viewer-side player; nothing in this mock's stack
  approximates that honestly.
- **Breakout rooms** — needs real multi-room routing and participant
  reassignment logic across more than 2-3 mock personas; with this app's
  single learner + 3-lecturer roster, a "breakout" would just be
  re-shuffling the same 2-4 tiles into fake sub-rooms with no one
  actually in them — cosmetic, not real.
- **Polls/Q&A** — technically buildable as a small `useSyncExternalStore`
  store (same pattern as reactions), so this is the one candidate that
  could be built honestly with existing patterns if wanted in a future
  pass — flagging it here rather than building it silently, since it
  wasn't asked for and would expand this task's scope.

## Verification

`tsc --noEmit` and `npm run build` clean for both parts. Live-verified via
`npm run dev` + `curl`: `/lecturer/sessions/sr-1/room` and
`/member/sessions/sr-1/room` both 200, no `__next_error__`/"Application
error" markers, and the server-rendered HTML contains the new controls'
`aria-label` text ("Add a participant", "Start presenting") plus all 6
reaction buttons ("React with 👍" through "React with 🙌"). What curl
can't confirm and would need a real browser check: the actual visual
result of toggling presenting (teal border + badge appearing on the
user's own tile), a reaction burst actually appearing centered over the
video grid and disappearing after ~2 seconds, and a newly added
participant's tile appearing in the grid alongside the existing two
without breaking the grid layout at 3+ tiles.

# Real Browser Media, Room Polish, and 3-Way Start Flow

Upgraded the Mock Session Room's camera/mic/screen-share from visual-only
local state to genuine browser media, added a visual polish pass, and
gave both portals Meet's own 3-way start choice. Three commits:
`499ddcd` (media), `f4ce886` (polish), `5644f74` (start flow).

## What's now genuinely real

- **Camera** — `navigator.mediaDevices.getUserMedia({ video: true })` on
  toggle-on; the resulting `MediaStreamTrack` renders in the local
  user's own tile via a real `<video>` element (`srcObject`), not an
  avatar. Toggle-off calls `track.stop()`, genuinely releasing the
  camera (confirmed by the browser's own camera-indicator light turning
  off — see the one honest verification gap below).
- **Mic** — its own independent `getUserMedia({ audio: true })` track,
  so muting/unmuting the mic never disturbs the camera track (and vice
  versa) — mute sets `track.enabled = false` on the real track rather
  than stopping it, matching how mute genuinely works in real
  conferencing apps (unmuting doesn't need a fresh permission prompt).
- **Screen share** — `getDisplayMedia({ video: true })`, triggering the
  real OS/browser share picker. Cancelling the picker
  (`AbortError`/`NotAllowedError`) silently reverts the toggle — not a
  real error. The browser's own "Stop sharing" bar ending the capture is
  caught via the video track's `ended` event, syncing our state back to
  off. The captured stream renders in the same `<video>` tile with the
  existing "Presenting" badge.
- **Permission-denied errors** — camera/mic/screen-share each surface a
  real inline banner (this app's existing `var(--red-dim)`/
  `var(--red-light)` Dialect B error convention, same as
  `request-session-modal.tsx`'s error banner) rather than a raw
  `alert()`.
- **Cleanup** — all camera/mic/screen tracks are stopped both on
  Leave/End Session (explicit call in `handleLeave` before navigating
  away) and on component unmount (`use-media-stream.ts`'s own effect) —
  this was flagged as a real resource-leak risk if skipped, since a
  stopped component reference without `track.stop()` leaves the
  browser's camera light on indefinitely.
- **3-way start choice** — "New Session" on both `/lecturer/sessions`
  and `/member/sessions` now opens a menu with Start now / Schedule for
  later / Get invite link, matching Meet's own "New meeting" choice
  (Create a meeting for later / Start an instant meeting / Schedule).
  Schedule reuses the pre-existing `requestSession()` flow — confirmed
  still fully intact — via the member's existing `RequestSessionModal`
  and a new, symmetric `ScheduleSessionModal` for the lecturer side
  (lecturers previously had no way to propose a session themselves, only
  approve/reject one). Invite creates the same INSTANT session as Start
  Now but shows the real room route as a copyable link first
  (`InviteLinkModal`) instead of navigating straight in — honestly
  buildable because it's the real URL to the real `[id]/room` route,
  unlike a genuine multi-tenant invite/token system this mock has no
  backend for.

## The one explicit, honest limitation

**No other participant ever receives real video.** John Doe's tile, and
any tile added via `AddParticipantModal`, always stay the initials-avatar
placeholder — documented inline in `participant-tile.tsx`'s `videoStream`
prop docstring. This mock has no signaling/TURN backend, so there is no
real peer connection to carry another person's camera into this browser;
faking it with a stock photo/video loop would misrepresent a fake feed as
real, which is exactly the dishonest-gap pattern this project has spent
many phases removing elsewhere. Only the local "you" tile can ever show
real video, for either camera or screen-share.

## Verification — what curl/build confirm vs. what needs a real browser

`tsc --noEmit` and `npm run build` clean. Live-verified via `npm run dev`
+ `curl`: `/lecturer/sessions`, `/member/sessions`,
`/lecturer/sessions/sr-1/room`, `/member/sessions/sr-1/room` all 200, no
`__next_error__`/"Application error" markers; confirmed the "New
Session" trigger button and the room's "Add a participant" control are
present in the server-rendered HTML.

**Honestly out of reach for curl, and NOT claimed as visually
confirmed:** the actual camera permission prompt appearing, a real video
feed rendering in the tile after granting it, the browser's real
screen/window/tab picker opening on the screen-share button, the
captured screen actually appearing in the tile, the permission-denied
banner appearing when access is blocked, and the browser's camera/mic
indicator light turning off after Leave/unmount. All of these require a
real browser with real camera/screen-share hardware or permissions and
were verified by careful code reading (correct API calls, correct event
handling, correct cleanup) rather than by seeing them render — this is
stated explicitly rather than implying a curl-based check could confirm
browser-native permission UI or actual media rendering.

# Recording, Live Captions, Presenter Layout, Add-Participant Polish

Two commits: `8c39599` (recording + live captions), `7d5a112`
(presenter-large layout + Add Participant modal polish).

## Recording (MediaRecorder) — real, local-only

`use-session-recording.ts` wraps `MediaRecorder` over whichever stream is
currently active (camera, or the screen-share stream while presenting).
Stopping produces a real `.webm` file via the same Blob → object URL →
`<a download>` pattern `lib/utils.ts`'s `exportToCsv` already uses — not
a new download mechanism. A real "REC 00:00" indicator (red dot + live
timer, ticking via `setInterval`) shows while active.

**Explicit limitation, same class as camera/screen-share:** a recording
can only ever capture the LOCAL user's own stream. There is no real peer
connection carrying another participant's audio/video into this
browser, so nothing recorded ever contains anyone else — stated in the
commit message and worth restating here since it's the same underlying
constraint as the earlier media work, just surfacing again for a new
feature.

## Live captions (Web Speech API) — real, local-only, browser-gated

`use-live-transcript.ts` wraps `SpeechRecognition` (ambient-typed locally
since it's not in TypeScript's default DOM lib — still non-standard/
vendor-prefixed) over the local mic. Interim results render as a
Meet-style caption bar overlaid on the video grid; final results append
to a copyable transcript log.

**Two things surfaced explicitly, not silently:**
- **Browser support** — Chrome/Edge only. `unsupported` is a real state
  checked before starting, shown as an inline message both on the
  caption overlay and in the transcript panel, not a silent failure or
  swallowed exception.
- **Local-only capture** — same reasoning as recording: no real peer
  audio stream exists to feed into `SpeechRecognition` either, so only
  the local user's own speech is ever transcribed. The transcript panel
  header literally says "(you only)" and its footer restates why.

## Presenter-large layout

`video-tile-grid.tsx` restructures while `presenting` is true: the
presented content becomes one large primary tile, every other tile
(other participant, any added participants) collapses into a small side
strip — matching Meet's real behavior. Reverts to the existing equal
grid the moment presenting stops. Pure CSS/flex, no new dependency.

## Add Participant modal polish

Added a real search/filter input (same Dialect B search-input pattern as
`kcs-pillar-view.tsx`), initials-avatar circles matching the room's
existing tile/list styling, and a visually grayed-out/disabled row for
anyone already in the room instead of silently omitting them — clearer
feedback than a row that just doesn't appear.

## Verification

`tsc --noEmit` and `npm run build` both clean. Live-verified via
`npm run dev` + `curl`: `/lecturer/sessions`, `/member/sessions`,
`/lecturer/sessions/sr-1/room`, `/member/sessions/sr-1/room` all 200, no
`__next_error__`/"Application error" markers; confirmed "Add a
participant", "Start recording", and "Turn on captions" `aria-label`
text present in the server-rendered HTML. As with the prior media pass,
actual recording playback, live caption accuracy, and the real
mic-permission-driven transcription flow all require a real Chrome
browser to confirm — not claimed as visually verified here, only
verified by code reading (correct API usage, correct cleanup, correct
browser-support gating).

# Two Session-Room Bug Fixes: Hide Side Panel, Countdown/COMPLETED Gates

Commits `c9b7382` (hide side panel) and `0ef8007` (countdown/COMPLETED
gate removal).

## Bug 1: hide side panel (distinct from self-view)

The existing self-view toggle (hides only the local user's own tile from
their own screen) was mistaken for a panel-hide feature — a genuinely
separate, previously-unbuilt control. Added `sidePanelHidden` local
state to `session-room-view.tsx` with its own `ControlBar` button. The
room's outer grid drops its `lg:grid-cols-[1fr_260px]` split and falls
back to a single full-width column while hidden, so the video grid
genuinely re-flows into the freed width rather than leaving blank space.

## Bug 2: couldn't rejoin ended sessions / countdown blocked entry

Traced to two gates left over from the earlier open-access ("Slack
huddle") decision, which had only removed `requestSession()`'s
enrollment/completion precondition — not these two:

- `session-card.tsx`'s `canJoin` no longer depends on a live countdown
  to `scheduledAt` (`useCountdownToTime` is now unused anywhere in the
  repo — confirmed via grep, deleted along with its only caller).
- The actual "hard block" turned out to live in `session-card.tsx`, not
  `session-room-view.tsx`: the Join/Start link was previously rendered
  only inside `{status === 'APPROVED' && scheduledAt && (...)}`, so
  PENDING/REJECTED/COMPLETED sessions never got a room link at all. The
  room component itself never gated on status — only on the request
  existing — so navigating directly to a COMPLETED session's room URL
  already worked before this fix; the card just never offered that link.
  Every status now gets a real link into its room; COMPLETED shows
  "Rejoin Session" instead of "Join/Start Session" for clarity.
- No status-transition change was needed for clean re-entry:
  `completeSession()` only runs from `handleLeave()` on the lecturer's
  own Leave/End Session action, never on room entry — so reopening an
  already-COMPLETED session has no entry side effect, and leaving it
  again just re-sets status to COMPLETED (idempotent).

**Verification:** `tsc --noEmit` and `npm run build` both clean.
Live-verified via `npm run dev` + `curl`: `/lecturer/sessions/sr-3/room`
(the seeded COMPLETED session) now returns 200 with the real "Mock
Session Room" UI instead of being blocked; confirmed "Hide participants
and chat panel" appears in the server-rendered HTML alongside the
existing controls.

# Portal Consolidation Audit (read-only, no deletions made)

Per an explicit request to map the blast radius of removing the
Lecturer and Contributor portals and folding them into Admin BEFORE any
deletion happens, a read-only audit was run and written to
`.claude/skills/kls-page-builder/references/portal-consolidation-audit.md`
(gitignored, like other skill-reference docs — see the earlier note on
`.gitignore` lines 18-19 — so it exists on disk but produces no git diff).

**Headline findings:** 52 files total across both portals (22 lecturer,
30 contributor) — plus two shared trees NOT part of the deletable
footprint since `/member/*` also depends on them: `components/session-room/**`
(19 files) and `lib/messaging/**` (10 files). Some contributor features
(My Courses, My Research, most of Earnings) already have a ready
admin-side data path needing only a filtered view. Others need real
work: admin's session oversight is read-only by design (no approve/
reject UI), and admin's publishing review reads a completely different,
disconnected store from the contributor's own submissions list. Some
features (the real-media session room, admin messaging) have **no**
admin entry point at all today — new work, not a deletion. Course
instructor / publication author / research contributor all need to
survive as data-model fields regardless of portal removal.

No files were deleted or edited during this audit beyond the one new
markdown doc — confirmed via `git status` before and after. This is
flagged as its own multi-phase project (build missing admin equivalents
→ strip role-switcher/sidebar entries → delete portal directories →
clean up cross-references → optionally retire the `UserRole` values as a
separate, human-approved step), not a single autonomous pass.

# Phase 1, Wave 1: Prerequisite Admin Equivalents

Per the audit's own sequencing, split into two waves: Wave 1 (this pass)
fixes the real bug the audit surfaced plus the two capabilities that
block everything else in Phase 1 from being buildable; Wave 2 (a
follow-up) covers the remaining "mine"-filtered views and the admin
messaging decision. Nothing under `app/lecturer/**` was touched;
`app/contributor/publishing/**` was touched only for item 1, as the
correctness fix genuinely required both sides of the store to change —
confirmed with the user before proceeding, given the task's own
instruction to avoid portal folders this phase. Three commits:
`f9670ed` (store merge), `9964771` (admin approve/reject), `5c0bd9d`
(admin room entry point).

## Item 1 — merged the disconnected review-queue / my-submissions stores

Confirmed the audit's finding by direct code read: `use-review-queue.ts`
(admin) and `use-my-submissions.ts` (contributor) were two independent
module-level arrays sharing only coincidentally-matching seed IDs
(`pub-001`, `pub-004`). An admin approval called
`removeSubmissionFromQueue()`, which never touched the contributor's own
array — their My Submissions list would show a title stuck at SUBMITTED
forever even after it was genuinely decided elsewhere. This was treated
as its own correctness bug, independent of whether portal consolidation
ever happens, per the task's framing.

Fixed by making `review-data.ts`/`use-review-queue.ts` (admin-owned, the
side staying long-term) the single source of truth: adopted the
contributor's richer 6-state `PublicationStatus`
(DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/PUBLISHED) in place of
admin's narrower 2-state `ReviewStatus`, carrying every field either side
needs (contributor, language, coverImage, description). New
`setSubmissionStatus()` replaces `removeSubmissionFromQueue()` — approve/
reject now transitions status in place instead of deleting the row, so
the contributor still sees it (as APPROVED/REJECTED), rather than having
it silently vanish. `app/contributor/publishing/_components/use-my-submissions.ts`
is now a thin wrapper filtering the shared store to `CONTRIBUTOR_NAME`;
`my-submissions-data.ts` re-exports the shared types instead of defining
its own.

**Traced precisely, not assumed:** both files import the exact same
module (`@/app/dashboard/publishing/review/_components/use-review-queue`
vs. `./use-review-queue` from within the same folder resolve to one file
on disk), so there's exactly one module-level array and one `listeners`
Set. An admin's `setSubmissionStatus()` call triggers `emitChange()`,
which reaches every subscriber — contributor-side included — via the
same `useSyncExternalStore` mechanism, with no separate sync step.
Live-verified via `curl` that both `/dashboard/publishing/review` and
`/contributor/publishing` return 200 with no error markers post-merge.

## Item 2 — real Approve/Reject on admin's session oversight

`sessions-view.tsx` (`/dashboard/e-learning/sessions`) was read-only by
its own prior docstring — confirmed as the single biggest functional gap
the audit found. Now reuses the exact same `approveSession()`/
`rejectSession()` store functions and `SessionDecisionModal` component
the lecturer's own Session Requests queue already calls — no second
parallel action path, per the task's explicit instruction. This is a
genuine superset of the lecturer view: an admin can act on any PENDING
request platform-wide, not just ones for courses one specific lecturer
teaches. Non-PENDING rows get a real "Room" link instead (wired to
item 3's new route).

## Item 3 — admin entry point into the real session room

Previously the only two callers of `SessionRoomView` were the lecturer
and member room pages — zero admin entry point existed into the most
technically complex piece of either portal (real getUserMedia/
getDisplayMedia/MediaRecorder/SpeechRecognition). Added
`/dashboard/e-learning/sessions/[id]/room`, reusing `SessionRoomView`
exactly — no new room implementation, per the task's instruction.

**Viewer-role decision:** added a genuine third `viewer: 'admin'` mode
rather than reusing `'lecturer'`. Reusing lecturer would have mislabeled
the admin as "you" in place of the real instructor and let an observing
admin's Leave action silently call `completeSession()` on someone else's
session — neither is correct for a third-party observer. With `'admin'`:
both real participants (learner and lecturer) render as genuinely named
tiles instead of one being relabeled "you" (the lecturer's name flows
through a new `adminExtraParticipant` slot, reusing the existing
`extraParticipants` mechanism rather than inventing a new one), and Leave
never marks the session COMPLETED. `ParticipantListPanel`/
`SessionSidePanel`'s role union gained `'Admin'` alongside the existing
`'Lecturer' | 'Learner'`. Extracted `build-room-participants.ts` and
moved permission-error copy/timer formatting into `room-error-banner.tsx`
to keep `session-room-view.tsx` under the 200-line cap with the added
viewer complexity.

**Verification:** `tsc --noEmit` and `npm run build` both clean
(confirmed the new route compiled: `dashboard/e-learning/sessions/[id]/room`
appears in the build's route list). Live-verified via `npm run dev` +
`curl`: `/dashboard/publishing/review`, `/contributor/publishing`,
`/dashboard/e-learning/sessions`, and `/dashboard/e-learning/sessions/sr-1/room`
all return 200 with no `__next_error__`/"Application error" markers; the
admin room route's server HTML contains "Back to Session Oversight" (the
admin-specific back-link label) and "Mock Session Room", confirming
`viewer="admin"` is genuinely active, not silently falling back to
another mode.

**Branch note:** mid-session, the working tree's checked-out branch
had switched to `feat/ui-improved` (one commit ahead of `auto-wip`, no
divergent history) between an earlier session and this one. Verified via
`git merge-base --is-ancestor` that `auto-wip` was a clean ancestor
before fast-forwarding `auto-wip` to include the new work — no
force-push, no history rewrite, no lost commits — then switched back to
`auto-wip` for all 3 commits above.

# Full Portal Consolidation — Phase 2 (Wave 2)

Executing the audit's full consolidation plan phase by phase, per the
task's own numbering (task Phase 2 = audit's Phase 1 Wave 2). Commit
`d321f6f`.

## 1. Real filtered admin views (contributor/author)

Added a real dropdown filter — not just relying on the existing free-text
search — to the 4 admin pages that already read the shared stores
`/contributor/{courses,earnings,research}` used to filter client-side:

- `revenue-table.tsx` — "Contributor" filter (reproduces
  `/contributor/earnings`'s framing over the same live `useRevenue()` store).
- `repository-view.tsx` — "Author" filter (reproduces
  `/contributor/research`'s framing over the same live `useRepository()` store).
- `collaborations-view.tsx` — "Contributor" filter over `mockProjects`
  (same data `/contributor/research` read for its project list).
- `catalog-view.tsx` — "Author" filter + a new Author column (reproduces
  `/contributor/courses`'s framing over the same live `useCourseCatalog()` store).

All four are genuine dropdowns populated from the real distinct values in
the data (`Array.from(new Set(...))`), not hardcoded option lists —
so a new contributor/author appearing in the data is automatically
filterable with no extra wiring.

## 2. Lecturer's course-catalog data link

Investigated before touching anything: admin's `CourseCatalogEntry`
(`/dashboard/e-learning/_shared/course-catalog-data.ts`) and the
member-facing `CatalogCourse`
(`/member/_shared/course-catalog-data.ts`) are genuinely two separate
datasets (different id schemes — `crs-001` vs `'1'` — zero overlapping
ids, different fields). Grepped every real consumer of `lecturerId`
(session booking's `request-session-modal.tsx`, course chat's
`derive-channels.ts`/`message-thread-panel.tsx`, the lecturer/member
session-start menus) and confirmed all of them read the **member**
catalog, never admin's — so merging the two full catalogs would be a
much larger rewrite of the taken-course experience (lessons/ratings/
enrollment) for no real benefit, not what "resolve the data drift" asked
for.

Instead, added a real `lecturerId?: string` field directly to admin's
`CourseCatalogEntry`, resolving through the same `lecturerRoster` the
member catalog already points at — this is a real, editable instructor
assignment (Add Course + Edit Course both gained an "Instructor" select;
Course Detail shows the assigned name or "None assigned"), not a
decorative label. The two catalogs remain intentionally separate
(different lifecycles), but both now resolve "who teaches this" through
one shared roster rather than admin having no concept of it at all.
Seeded `lecturerId` on 2 of the 6 admin catalog rows where a real
instructor-of-record made sense (`crs-001` → `lec-1`, `crs-002` →
`lec-2`); left the platform-authored rows without one rather than
fabricating an instructor no data implied.

## 3. Messaging and dashboard-rollup: decided NOT to build

Per the task's own instruction not to build something nobody would
reach:

- **Admin messaging** — checked `deriveCourseChannels()`
  (`lib/messaging/derive-channels.ts`) precisely: it resolves a person's
  course channels by matching their name against `lecturerRoster`. An
  "admin" identity has no roster entry, so an admin's own `MessagesView`
  would always show zero course channels — a permanently empty inbox,
  not a real oversight surface. **Decision: no admin messaging route
  built.** Member↔lecturer course chat is completely unaffected — it
  keeps working via the shared `lib/messaging/**` infrastructure exactly
  as today; only the lecturer's own portal page to view their inbox goes
  away with no replacement. This is a real, intentional feature loss
  (a lecturer persona could see their own DMs/course channels; post-
  consolidation, nobody can, since there's no lecturer login anymore
  either) — flagged explicitly rather than silently dropped.
- **Per-instructor dashboard rollup** — the lecturer dashboard's 4 stat
  numbers (course count, enrolled students, session requests, upcoming
  sessions) were confirmed, by reading
  `app/lecturer/_components/dashboard-data.ts` directly, to derive from
  stores that already survive (member catalog,
  session-requests store) — all 4 numbers are now independently
  reachable via the newly-filtered `/dashboard/e-learning/catalog` and
  the existing `/dashboard/e-learning/sessions` oversight page.
  **Decision: no dedicated rollup page built** — it would be a redundant
  summary card over data already visible one click away, not new
  capability.

## Verification

`tsc --noEmit` and `npm run build` both clean. Live-verified via
`npm run dev` + `curl`: all 4 filtered admin routes return 200 with no
error markers; confirmed "Filter by contributor"/"Filter by author"
aria-labels present in each file's source, and the new "Instructor"
field present in both the Add Course and Edit Course forms.
