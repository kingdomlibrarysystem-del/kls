# Remaining Pages — Admin/Member Deep Dive Findings

A code-verified audit of every module NOT already covered by
`library-findings.md`, `elearn-findings.md`, or `public-findings.md`:
Publishing, Research, Users/Roles/Invitations/Audit Log/Reports/Settings,
Notifications/Messages/Profile/Downloads/AI, the "Coming Soon" placeholders,
and member-only Cart/Favorites/Leaderboard/Orders. Every claim below was
verified by directly reading the cited file.

## TL;DR

- **Confirmed serious security bug: `PATCH`/`DELETE /api/roles/[id]` have
  no auth check at all.** `requireAdmin` is imported but never called in
  either handler — any request, unauthenticated included, can rename a
  role, rewrite its `permissions[]`, or delete it. Verified directly by
  reading the full route file.
- **Confirmed regression: the public Publication detail page 401s for
  every anonymous visitor.** A commit that (correctly) added
  `requireStaff()` to `GET /api/publications`'s list route broke a
  pre-existing public consumer that calls the same hook unconditionally.
  Verified end-to-end.
- **CLAUDE.md is out of date in two more places, on top of the auth
  finding from earlier this session**: (1) Research is described as "not
  yet migrated" but is fully real (Phase 6, per PROGRESS.md, which
  CLAUDE.md itself says to trust more); (2) Health is listed as one of "6
  Coming Soon" placeholders with "zero schema/API" but has real Prisma
  models (`Clinic`, `Appointment`, `HealthRecord`, `Immunization`) and
  real API routes — only 5 modules (Beauty, Counseling, Rehabilitation,
  Donations, News) remain true placeholders.
- **Role permissions are inert.** The granular `permissions[]` array is
  fully editable via the Roles UI but zero code anywhere reads it — real
  RBAC only checks the 4-way `admin/manager/staff/member` name, so
  "granting" a permission in the UI has no actual effect.
- **Invitations don't actually invite anyone.** No token, no expiry, no
  email sent, no accept-flow page exists anywhere — the "Invitation sent"
  success message is misleading; "Resend" just flips a status flag with
  nothing behind it to resend.
- Otherwise, this batch skews positive: Users/Roles(view)/Audit
  Log/Reports/Notifications/Messages/Profile/Cart/Favorites/Leaderboard/
  Orders are all genuinely real, further along than a typical mid-migration
  snapshot would suggest.

## Working — Admin

| Feature | File | Evidence |
|---|---|---|
| Publishing CRUD (create/approve/reject/withdraw/toggleFeatured/delete) | `app/api/publications/route.ts`, `[id]/route.ts` | Real Prisma `Publication`; approval runs a real `$transaction` creating a `Resource` + `RevenueShare` row |
| Publishing auth gating | same files | `requireOwnerOrStaff`/`requireStaff`/`requireAdmin` genuinely applied on every write route (added deliberately in commit `c00cfa3`) |
| Revenue-share computation | `app/api/publications/[id]/route.ts:123-161`, `revenue-table.tsx` | Real 70/30 (or caller-supplied) split persisted at approval, real ranking/stats UI reads it |
| Research — genuinely migrated (Phase 6) | `app/api/research-projects/**`, `app/api/research-papers/**` | Real `ResearchProject`/`ResearchPaper` Prisma models, real CRUD, `requireStaff()`-gated, real `fetch()` hooks — no mock arrays remain |
| Users CRUD incl. role reassignment | `app/api/users/route.ts`, `[id]/route.ts` | Real create (temp password, bcrypt), edit, delete; role-field change specifically requires `requireAdmin()` |
| Roles — view/create (not edit/delete, see Bugs) | `app/api/roles/route.ts` | Real `Role` model, admins can create roles and edit permission checkboxes in the UI |
| Invitations create/list/resend/cancel (DB-row only, see Mocked) | `app/api/invitations/route.ts`, `[id]/route.ts` | Real DB rows tied to a real `roleId` FK, `requireStaff()`-gated |
| Audit Log — real and populated | `app/api/audit-log/route.ts` | Real model, `requireAdmin()`-gated read, populated by real events from 4 frontend call sites (login/logout, user-created, borrow-approved, publication approved/rejected) |
| Reports — cross-module dashboard | `app/api/reports/cross-module/route.ts` | Real live `Promise.all` of real Prisma counts across Users/Borrow/Enrollment/Publication/ResearchProject — the old mock-file import found in an earlier investigation has since been removed |
| Settings — borrow/reservation policy | `app/api/settings/route.ts` | Real single-row `Settings` model, genuinely consumed by the Borrowings due-date calc |
| Notifications SSE live delivery | `app/api/notifications/stream/route.ts`, `lib/notify.ts`, `lib/sse-hub.ts` | Real `EventSource`/SSE endpoint; `notify()` called from 12+ real event sites across the app, not demo-only |
| Messages — admin inbox with real ownership checks | `app/api/messages/route.ts`, `[id]/route.ts` | `senderId`/`userId` checked against the real session (`requireOwnerOrStaff`), not trusted from the request body — the auth gap the commit claims to close is genuinely closed |
| Profile (admin) | `contexts/auth-context.tsx:88-96`, password/2FA/sessions routes | Real `PATCH /api/users/[id]`, real password change, real 2FA status, real Sessions & Devices, real Login History |

## Working — Member

| Feature | File | Evidence |
|---|---|---|
| Messaging is NOT admin-only | `app/member/messages/page.tsx` | Renders the same real `MessagesView` component as admin — members can genuinely send/view/reply, not just watch an inbox |
| Profile (member) | `EditProfileModal` | Same real `updateUser()` path as admin |
| Cart | `app/member/_shared/use-cart.ts`, real `Cart`/`CartItem` models | Real `fetch('/api/cart')`; BORROW/RESERVE items resolve into real `Borrow`/`Reservation` rows on confirm. SALE/RENTAL checkout is honestly disabled (Stripe not configured), not a hidden bug |
| Favorites | `app/member/_shared/use-favorites.ts` | Real, per-user persisted via `/api/favorites` — not localStorage |
| Leaderboard | `app/member/leaderboard/page.tsx:22-45` | Real computed ranking from real Certificate/Borrowing data (honestly scoped to the current user only, no cross-member borrow-count exists) |
| Orders (member view) | `app/member/_shared/use-orders.ts` | Real `GET /api/orders?userId=` — the member-facing *view*, not just the checkout write path, is real |
| Notifications (member) | `app/member/notifications/page.tsx` | Real, per-person `recipientId`-scoped, ownership-checked |

## Bugs — confirmed

1. **`PATCH`/`DELETE /api/roles/[id]` have zero auth check — real privilege-escalation bug.** `app/api/roles/[id]/route.ts:42-94` — `requireAdmin` is imported (line 5) but never called in either handler; only `GET` calls `requireStaff()` (line 12). Verified by reading the full file: any request, including an unauthenticated one, can rename a role, overwrite its `permissions[]` array, or delete it (subject only to a "0 users assigned" guard on delete). This is a genuine security hole, not a design gap — role name/permissions edits are explicitly meant to be admin-only per `lib/auth/require-role.ts`'s own comments.

2. **Public Publication detail page 401s for every anonymous visitor.** `app/(public)/library/[id]/_components/publication-detail-view.tsx:39,44` unconditionally calls `usePublications()` (which hits `GET /api/publications` with no `contributorId` param), and `app/api/publications/route.ts:73` falls back to `requireStaff()` when there's no `contributorId` — so an anonymous caller always gets 401, which the page then surfaces as a hard "Couldn't load this publication" error overriding the whole page, even for books that only need the (unauthenticated-safe) `Resource` lookup. Verified end-to-end by reading both files. This looks like a real regression: commit `c00cfa3` (2026-08-18, "add real session/role and ownership checks to Publishing and Research APIs") added `requireStaff()` to the list route without accounting for this pre-existing public consumer, which the admin Published Catalog page still links to (`catalog-card.tsx:56`).

3. **`user.joinDate` is always undefined on the User Detail page.** `app/dashboard/users/[id]/_components/user-detail-view.tsx:147` reads `user.joinDate`, but neither `GET /api/users` nor `GET /api/users/[id]`'s serializer ever emits a `joinDate` field (they emit `createdAt` instead) — the "Joined" row will always render blank/undefined.

4. **Research Submit Paper's "Manuscript File" input is dead.** `app/dashboard/research/submit/_components/paper-form-view.tsx:134-143` — a raw `<input type="file">` exists but is never registered with the form, has no `onChange`, and the Zod schema has no file field at all. Choosing a file silently does nothing on submit; there is no upload logic anywhere in the Research module.

## Mocked / not yet built / intentional placeholders

- **Invitations don't send anything.** The `Invitation` Prisma model has no `token`/`expiresAt` field, `POST /api/invitations` never calls `lib/mailer.ts`, and there is no accept-invite page anywhere in the app. "Resend" just flips status back to `PENDING` with nothing behind it. The UI's "Invitation sent to {email}" message is misleading — no email actually leaves the system. This is a real, undocumented gap (not flagged anywhere as an intentional stub).
- **Role `permissions[]` are inert.** Fully editable in the UI, but zero files under `lib/` read `.permissions` — real RBAC gating only checks the fixed 4-way role name. Granting a permission checkbox to a custom role currently has no effect anywhere.
- **Publishing has no admin Create/Submit UI.** The only way a `Publication` DRAFT row gets created today is a direct API call — `app/dashboard/publishing/page.tsx`'s "Submit a Book" card has no `href` and is permanently "Coming Soon." The page's own "Planned API Endpoints" comment block is stale (describes endpoints that don't match what was actually built) and should be treated as historical, not a live spec.
- **`RevenueShare.totalRevenue` is always 0.** Set once at approval time and never incremented by any order/payment route — an intentional, self-documented limitation ("no revenue-per-copy simulation yet"), not a hidden defect, though worth noting the public Buy/Rent flow exists without feeding this number.
- **Research Collaborations is read-only by design** — no create/edit/delete UI exists for projects, even though the underlying API fully supports it. Matches PROGRESS.md's own documented, intentional scope cut.
- **AI & Tools is fully mocked**, explicitly labeled as such in its own UI copy ("Mocked semantic search and chat assistance") — matches CLAUDE.md's "future AI assistance" framing exactly.
- **5 of 6 "Coming Soon" placeholders match the documented pattern exactly**: Beauty, Counseling, Rehabilitation, Donations, News — consistent "planned for a future phase" banner, inert cards, no data fetching, no Prisma model. (Health is the exception — see Suspicious below.)
- **Only one Settings tab exists** — Borrowing & Reservation Policy. No site-wide settings, email-template editor, or payment-provider config UI, matching the single-model `Settings` schema (4 int fields).
- **Audit coverage is thin and manual, not systemic** — logging fires from exactly 4 hardcoded frontend call sites, not a server-side hook on mutations. Real deletes/edits of Users, Roles, Invitations, and Settings changes are not audit-logged at all, despite the Audit Log page's own subtitle implying broader coverage.

## Suspicious / worth a second look

- **CLAUDE.md's Research claim is stale.** It states Research is "NOT YET migrated," but PROGRESS.md (which CLAUDE.md itself designates as the more current source) documents Phase 6 as fully completed, and direct code reading confirms real Prisma models, real CRUD routes, and real `fetch()` calls throughout — no mock arrays remain.
- **CLAUDE.md's "6 Coming Soon, zero schema" claim is also stale for Health.** `prisma/schema.prisma` has real `Clinic` (line 1336), `Appointment` (1351), `HealthRecord` (1377), and `Immunization` (1393) models — verified directly — plus real API routes (`app/api/clinics`, `app/api/appointments`, `app/api/health-records`, `app/api/immunizations`) wired to real `fetch()` calls in `app/dashboard/health/_shared/use-health.ts`. Its hub page links to real sub-pages with real views, not inert "coming soon" cards. PROGRESS.md documents an early mock-migration step for Health but has no entry for the subsequent real-Prisma migration that clearly happened afterward. Only 5 modules remain true placeholders, not 6.
- **Health has a known, self-documented nav gap**: it's only linked from the admin sidebar, not from the member sidebar, even though its content (book a checkup, view my records) reads as member-facing. Worth confirming whether Health should be reachable from `/member/*` at all.
- **Invitations are `requireStaff`, not `requireAdmin`, despite being able to assign arbitrary roles** (role names get upserted by free-text match — a typo creates a brand-new, permission-less role rather than erroring). Currently low-risk since no email actually goes out, but worth revisiting alongside a stricter check if the accept-flow is ever built.
- **Auth-gating is enforced piecemeal, route-by-route, rather than as a consistent policy** across Users/Roles/Invitations/Settings — `middleware.ts` only enforces one shared `admin/manager/staff` bucket at the page level; the tighter admin-only boundary is applied inconsistently (present on user role-reassignment/delete, role create, settings PATCH, audit-log read — and, per the confirmed bug above, absent entirely on role edit/delete).
- **`PAYMENT_PROCESSED` audit action is defined but dead** — zero call sites anywhere, including the PayPack webhook, which doesn't write to the audit trail despite handling real payments.
