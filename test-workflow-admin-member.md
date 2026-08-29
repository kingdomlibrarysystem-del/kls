# Manual Test Workflow — KCS Category Management (Admin → Member)

A step-by-step manual test walking a real admin through creating KCS
categories and a resource, then confirming a member sees the result.
Every field name, URL, and API route below is real — confirmed by
direct code read, not invented. No seed data is used; this exercises
the app exactly as a fresh, empty install behaves.

Use this whenever validating a change to `lib/kcs-taxonomy/**`,
`app/dashboard/kcs/**`, or the resource-creation flow.

## Prerequisites

- Real admin credentials: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.
- A second real account to act as "member" — either register a new one
  at `/auth/register`, or use any existing non-admin account.
- Dev server running (`npm run dev`).

## Step 0 — Confirm the empty-state fix (skip if categories already exist)

1. Log in as admin, go to `/dashboard/kcs`.
2. **Expected (with zero categories in the database):** a real "No KCS
   categories yet" empty state, with a "Create the first root category
   below to get started" message — **not** an indefinite loading
   skeleton. The "Manage Categories" section must be visible and usable
   directly below this message.
3. If you instead see a skeleton that never resolves, the bug described
   in `PROGRESS.md`'s KCS Map entry has regressed — check
   `app/dashboard/kcs/_components/kcs-map-view.tsx`'s render gate (it
   must not treat `!pillarSlug` the same as `loading`).

## Step 1 — Admin creates a root category

1. `/dashboard/kcs` → **Manage Categories** section → **New Category**
   form.
2. Fill in:
   - **Name**: `Philosophy`
   - **Slug**: leave as auto-generated (`philosophy`)
   - **Parent Category**: `— None (root category) —`
3. Click **Create Category**.
4. **Expected:** a success toast (`Category "Philosophy" created.`),
   real `POST /api/categories` call, the new category appears in the
   categories table below, and (per the fix above) a "Philosophy"
   pillar tab now appears in the KCS Map browse UI above.

## Step 2 — Admin creates a child category under it

1. Same **New Category** form.
2. Fill in:
   - **Name**: `Ethics`
   - **Slug**: leave as auto-generated (`ethics`)
   - **Parent Category**: `Philosophy` (the root just created)
3. Click **Create Category**.
4. **Expected:** success toast (`Category "Ethics" created.`), `Ethics`
   now appears in the table nested under `Philosophy`.

## Step 3 — Admin files a resource under the child category

1. Go to `/dashboard/library` → **Add Resource**.
2. Fill in the required fields exactly (all are real, schema-enforced —
   see `app/dashboard/library/_components/resource-form-schema.ts`):
   - **Title**: `Nicomachean Ethics`
   - **Author**: `Aristotle`
   - **KCS Scroll**: `Ethics` (only leaf/child categories are
     selectable here — `Philosophy` itself, being a root, will **not**
     appear in this dropdown; this is expected, not a bug)
   - **Total Quantity**: `3`
   - **Description**: `A foundational work on virtue ethics.`
   - **Publisher**: `Test Publisher`
   - **Language**: `English`
   - **Pages**: `250`
   - **Price**: `0`
   - **Cover image**: use the "Upload cover image" field to upload a
     real image via Cloudinary (required — the form will not submit
     without a real `coverImage` URL)
3. Submit.
4. **Expected:** real `POST /api/resources` call, success, the new
   resource appears in the admin library table under the `Ethics`
   category.

## Step 4 — Member sees the result

1. Log out of admin, log in (or register) as a member.
2. Go to `/member/library`.
3. Click the `Philosophy` section chip (the root category's chip is
   what the member-facing filter uses — child categories like `Ethics`
   are not shown as separate chips, only as a further breakdown once a
   resource is opened).
4. **Expected:** `Nicomachean Ethics` appears in the resource grid/list
   for that section — the "No resources are filed under this section
   yet" empty state should no longer show for `Philosophy`.

## Notes on what's real vs. not visible without a resource

- A category with **zero resources filed under it** is only ever
  visible as an empty-state chip (if it's a root) — a child category
  with no resources is not independently visible anywhere in the
  member UI. This is expected, not a bug: the member library is
  resource-first by design (see `app/member/library/page.tsx`'s own
  docstring).
- Deleting a category that still has resources assigned is blocked by
  a real server-side guard (`DeleteCategoryModal` / the resource-count
  check in `manage-categories-section.tsx`) — to clean up after this
  test, delete the resource first, then `Ethics`, then `Philosophy`.
