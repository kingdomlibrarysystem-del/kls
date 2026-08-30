# Digital Library — Admin/Member Deep Dive Findings

A code-verified audit of the Digital Library module: Resources, Borrowing,
and Reservations, across both `app/dashboard/**` (admin) and `app/member/**` +
`app/(public)/library/**` (member-facing). Every claim below was confirmed by
directly reading the cited file — nothing here is inferred from docs alone.

## TL;DR

- **The core circulation loop is real, not mocked**: resources, borrowings,
  and reservations are all backed by real Prisma/MongoDB models and real
  API routes, on both the admin and member side. A member can genuinely
  borrow or reserve a book today and see it reflected in the admin tables.
- **CLAUDE.md and PROGRESS.md are stale on auth.** Both currently claim
  `contexts/auth-context.tsx` is still a localStorage/mock and that
  member-facing borrow/reserve writes are blocked on it. That's no longer
  true — real NextAuth is wired in, and the member borrow/reserve flow uses
  a real session `user.id`. Confirmed directly (see "Docs drift" below).
- **Three real bugs found in the admin API**, all in the reservation →
  borrow lifecycle: the reservation queue never renumbers after a claim or
  expiry (only cancel does), `convertToBorrow` doesn't actually create a
  `Borrow` record, and `availableQty`/stock is never adjusted by any real
  circulation event — it's a cosmetic, manually-maintained number.
- A smaller bug: `type`/`format` are hardcoded on every resource created
  via the admin form, making the Type filter effectively non-functional.

## Working — Admin (`app/dashboard/library`, `borrowing`, `reservations`)

| Feature | File | Evidence |
|---|---|---|
| Resources list | `app/dashboard/library/_components/use-resources.ts` | Real `fetch('/api/resources?pageSize=1000')`, cached/listener pattern |
| Add/Edit Resource | `resource-form-modal.tsx` → `app/api/resources/route.ts` (POST, `requireStaff`), `[id]/route.ts` (PATCH) | ISBN is server-generated (`lib/generate-isbn.ts`), not client-entered |
| Archive resource | `resource-detail-view.tsx:86-95` | Real `PATCH { status: 'archived' }` |
| Resource detail page | `app/dashboard/library/[id]/_components/resource-detail-view.tsx` | Direct fetch of `/api/resources/:id` |
| Cover image upload | `components/ui/cloudinary-upload-field.tsx` | Real unsigned Cloudinary widget (`kls_uploads` preset), real `secure_url`; document upload also calls `/api/uploads/pdf-page-count` to auto-fill page count |
| Category assignment | `resource-form-basics.tsx:33-47` | Correctly leaf-only (`c.parentId !== null`), grouped under real root `<optgroup>`s from `/api/categories` |
| TEXT resource → first Chapter | `library-view.tsx:76-82` | Real `POST /api/chapters` right after resource creation |
| Borrowings list/detail | `app/dashboard/library/borrowings/**`, `use-borrowings-admin.ts` | Real fetch, 20s poll; detail page fetches `/api/borrowings/:id` directly |
| Approve/reject/return/waive fine | `app/api/borrowings/[id]/route.ts:71-141` | Server-side status-transition guards (e.g. 409 on re-approving an ACTIVE row), fine computed server-side (days overdue × 200 RWF), triggers real `notifyUser` |
| Reservations list/detail | `app/dashboard/reservations/**`, `use-reservations-admin.ts` | Same real-fetch pattern |
| Reservation notify | `app/api/reservations/[id]/route.ts` | Sets a real 48h `claimDeadline`, sends notification/email |
| Reservation cancel | same file, lines 129-142 | Correctly renumbers `queuePosition` for all remaining `PENDING` rows in one `$transaction` |
| Auth gating | `lib/auth/require-role.ts:56-58, 75-82` | Every mutating verb on resources/borrowings/reservations/categories gated by `requireStaff()`; owner-scoped reads gated by `requireOwnerOrStaff()` |

## Working — Member (`app/member/library`, `borrowings`, `reservations`, `app/(public)/library`)

| Feature | File | Evidence |
|---|---|---|
| Resource browse/grid | `app/member/library/page.tsx` | Real `useResources()` + `useCategories()`, Skeleton/EmptyState for loading/error |
| Category filter chips | `lib/kcs-taxonomy/taxonomy-helpers.ts:69-75` | `getRootCategories()`/`getChildCategories()`, parentId-aware; a root section correctly includes all child resources |
| Resource detail page | `app/member/library/resource/[id]/page.tsx` | Real data (found client-side from the real `useResources()` list), real reviews |
| KCS scroll detail page | `.../[section]/[scrollId]/_components/scroll-detail-view.tsx` | Real category/resource lookup |
| **Borrow request** | `app/(public)/library/_components/borrow-reserve-confirm-modal.tsx:67-77` | Real `POST /api/borrowings` with `userId: user.id` from the real session. Server validates via Zod, `requireOwnerOrStaff`, real FK checks, `$transaction`-guarded duplicate check, real due-date calc from `/api/settings` |
| **Reserve request** | same modal | Real `POST /api/reservations`, atomic `Resource.reservationQueueCounter` increment (race-safe queue position), real duplicate-active-reservation 409, real notification email |
| "My Borrowings" page | `app/member/borrowings/**`, `use-borrowings.ts` | Real `fetch('/api/borrowings?userId=...')` |
| "My Reservations" page | `app/member/reservations/**`, `use-reservations.ts` | Same real pattern; detail view correctly read-only (claiming happens in person via staff) |
| Dashboard "Currently Borrowed" widget | `app/member/_components/BorrowedBooks.tsx` | Real `useBorrowings()` — **this contradicts an old PROGRESS.md note calling it a static mock array; it has since been migrated and the doc wasn't updated** |
| Ownership enforcement | `lib/auth/require-role.ts:75-82` | Verified server-side, not just client-trust — a member cannot fetch or create a record under another user's id |

## Bugs — confirmed, admin-side reservation → borrow lifecycle

1. **Reservation queue doesn't advance after a claim or expiry.**
   `app/api/reservations/[id]/route.ts:119-127` (`convertToBorrow`) and
   `146-154` (`expire`) only flip the row's own `status` — unlike `cancel`
   (lines 129-142), neither renumbers `queuePosition` for the remaining
   `PENDING` reservations on that resource. The admin table only shows the
   "Notify" button when `queuePosition === 1`
   (`reservations-table.tsx:94`), and line 114 renders literal placeholder
   text `"Notify next in queue"` for an expired row instead of a real
   action. The next-in-line member is stuck with no queue position 1 and
   no admin action to reach them.

2. **`convertToBorrow` never creates a `Borrow` record.** Same file, same
   lines — the reservation is marked `CLAIMED`, but `prisma.borrow.create`
   is never called. A member who claims a reserved book has no due date,
   no return tracking, and doesn't appear in the Borrowings admin page at
   all. The action's name is misleading — it doesn't actually convert
   anything into a borrow.

3. **`availableQty`/stock is cosmetic.** Grepped all of
   `app/api/borrowings/**` and `app/api/reservations/**`: `availableQty` is
   only ever read (for display), never decremented on approve/convert or
   incremented back on return. The only way it changes is a manual PATCH
   via the Resource edit form. The "Stock" column shown in both the
   Resources and Reservations admin tables is not a live derived value —
   it will drift from reality immediately in real use.

4. **Secondary: `type`/`format` are hardcoded, never editable.**
   `library-view.tsx:65-66` hardcodes `type: 'Scroll'`, `format: 'Physical'`
   on every Add Resource call — no form field exists for either, and Edit
   never sends them either. Every admin-created resource ends up with
   identical type/format regardless of what it actually is, and the Type
   filter dropdown (`resources-table.tsx:41-44, 237-249`) is effectively
   non-functional since it will only ever offer one real value.

## Mocked / not yet built

- **"Write Your Scroll" modal** — `app/member/library/_components/write-scroll-modal.tsx`.
  Its own docstring calls it "fully mocked" — submitting just clears local
  state and closes; no fetch, no persistence, since there's no "My
  Scrolls" list page yet to append to. Matches a known PROGRESS.md backlog
  item.
- **No member self-service reservation cancel.** The only `cancel` action
  lives in `app/api/reservations/[id]/route.ts` PATCH, gated by
  `requireStaff()` — a member calling it directly would get a 403. This
  looks like a deliberate design choice (the member reservation view is
  read-only; claiming happens in person via staff), not a bug.
- **Reports module's cross-module aggregation** (`app/dashboard/reports/_components/cross-module-data.ts`)
  still imports from an old borrowings mock file, even though the real
  admin Borrowings page no longer uses that file for its own list. Deferred
  to a Reports-focused phase per PROGRESS.md.

## Suspicious / worth a second look

- **Unauthenticated GET on `/api/resources` and `/api/categories`** (list
  and single) — only POST/PATCH/DELETE are gated by `requireStaff`. Likely
  intentional (public library browse needs anonymous reads), but the
  unauthenticated response includes `documentUrl`/`audioUrl`/`videoUrl` for
  every resource with no visible entitlement check in this investigation's
  scope — worth a second look given this app's paywall/entitlement design
  elsewhere.
- **Reservation PATCH's catch-all branch.** `app/api/reservations/[id]/route.ts:64-69, 155-159` —
  when the request body has no recognized `action`, the fallback does
  `const data = { ...body }; delete data.action; prisma.reservation.update({ data })`
  with no field allowlist. A staff-authenticated caller could PATCH
  arbitrary fields (e.g. raw `userId`, `resourceId`, an out-of-enum
  `status` string). Low real-world risk since staff auth is already
  required, but it doesn't match the route's own docstring claim that
  every transition is guarded server-side.
- **Docs drift (the big one).** CLAUDE.md's "Two things genuinely remain
  unmocked" section and PROGRESS.md's Phase 3 entry both describe a
  mock-auth blocker on member-facing borrow/reserve writes. This is no
  longer true in code — confirmed directly by reading
  `contexts/auth-context.tsx` (real `next-auth/react` `useSession`,
  `signIn`, `signOut`) and `borrow-reserve-confirm-modal.tsx` (posts a real
  session `user.id`, and its own docstring says exactly this). Real auth
  appears to have landed as separate work outside the autonomous
  migration's phase log, so the log was never updated. Worth reconciling
  CLAUDE.md/PROGRESS.md with reality — flagging rather than silently
  editing those docs as a side effect of this investigation.
