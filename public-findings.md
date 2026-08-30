# Public/Home Pages — Deep Dive Findings

A code-verified audit of the public-facing pages: home/landing, auth
(login/register/password-reset), static marketing pages, and the public
Library/Course preview surfaces (`app/(public)/**`, `app/auth/**` — not
`/member/**`, already covered in prior investigations). Every claim below
was confirmed by directly reading the cited file.

## TL;DR

- **Auth is genuinely real, third time confirmed this session.** Login,
  registration, email verification, forgot/reset password, and Google
  OAuth are all real, well-implemented, and NOT the mock CLAUDE.md
  currently describes. Google OAuth specifically has real credentials
  configured, not just a decorative button.
- **Confirmed security bug, matching and extending the pattern found in
  the E-Learning investigation: raw file URLs for every resource are
  exposed to anyone via `GET /api/resources`.** `documentUrl`/`audioUrl`/
  `videoUrl` are unconditionally serialized with zero auth check on GET
  (`app/api/resources/route.ts:73-75`, no auth call anywhere in the GET
  handler). This is worse than it first appears: this app already has a
  *correctly gated* proxy for actual file access (`/api/resources/[id]/document`,
  `/download` — both do real entitlement checks) — but this raw-field
  leak on the list/detail endpoint completely bypasses that gating. A
  motivated anonymous visitor doesn't even need the proxy; they can read
  the direct Cloudinary URL straight out of the public library page's own
  network traffic.
- **The same "no auth on GET" pattern also applies to lessons here**,
  confirmed independently of the earlier E-Learning finding:
  `GET /api/lessons` has no auth check and returns full lesson
  `content`/`contentMarkdown` for any course to anyone — the public
  course-preview page itself only renders a lesson *count* (a fine
  teaser), but the underlying API is a full, directly reachable bypass.
- **The language switcher is real, but not the i18n system CLAUDE.md
  describes.** It's genuine Google Translate widget integration (not
  decorative), fully separate from the unused `locales/*.json` files —
  CLAUDE.md's "i18n isn't wired up anywhere" is technically true for the
  documented mechanism but doesn't capture actual page behavior.
- Borrow/Reserve/Enroll gating on public pages is correctly implemented
  end-to-end — anonymous visitors are cleanly redirected to `/auth/login`,
  never shown a modal that would silently fail.
- Smaller items: home-page stats ("195+ Countries", "2M+ Downloads") are
  fully invented numbers with no backing data; newsletter signup is an
  honest, harmless no-backend stub; registration doesn't auto-sign-in
  despite `auth-context.tsx`'s own `register()` function suggesting it
  should.

## Working — Public/Anonymous

| Feature | File | Evidence |
|---|---|---|
| Login | `app/(public)/auth/login/_components/login-form.tsx`, `lib/auth-options.ts` | Real bcrypt check, real TOTP/2FA support, real `LoginHistory` write, real revocable-JWT session via `UserSession` |
| Registration | `app/api/auth/register/route.ts` | Real `POST`, real `prisma.user.create` with bcrypt-hashed password, upserts a "Member" Role, rate-limited (5/15min) |
| Google OAuth | `lib/auth-options.ts:117-184`, `components/ui/google-signin-button.tsx` | Conditionally registered only when env vars present; real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` confirmed set — genuinely functional, not decorative |
| Email verification | `app/api/auth/register/route.ts:68-74`, `app/(public)/auth/verify-email/page.tsx` | Real Nodemailer send, real token confirm flow |
| Forgot/reset password | `app/api/auth/forgot-password/route.ts`, `reset-password/route.ts` | Real single-use tokens, real bcrypt rehash, no email-enumeration leak, rate-limited |
| Home page dynamic sections | `components/home/trending-books.tsx`, `elearning-section.tsx`, `research-section.tsx` | Real fetches (`/api/resources`, `/api/courses`, `/api/research-papers`) — each has a comment documenting removal of previously-fabricated fields (fake ratings/bios/read-times) |
| Certificate public verification | `app/(public)/certificate/verify/[code]/**`, `app/api/certificates/route.ts:59` | Server-side `verificationCode` filtering, not a client-side filter of a full list — no data leak |
| Public library browse | `app/(public)/library/_components/library-browser.tsx` | Shares the real `useResources()`/`getCategoryById` with the admin/member side — same real data, not a separate mock |
| Anonymous file access correctly blocked in the UI | `publication-detail-view.tsx:174-186` | Only links to `/member/library/read/[id]` gated by `isAuthenticated`; no direct `<a href={documentUrl}>`/`<video>`/`<audio>` anywhere in the public detail page |
| Gated file-serving proxy routes | `app/api/resources/[id]/document/route.ts:23-57`, `.../download/route.ts:20-51` | Real entitlement checks (free resource, staff, or real `Order`/`Borrow`/`Reservation`-backed `isEntitled()`); `/document` truncates to `freePreviewChapterCount` pages server-side for non-entitled callers |
| Chapter body gating | `app/api/chapters/route.ts:38-63` | Real per-resource price/entitlement check — docstring notes this was previously ungated and was fixed |
| Borrow/Reserve/Enroll anonymous gating | `book-card.tsx:112-123`, `publication-detail-view.tsx:231-257`, `course-preview-view.tsx:123-127` | All correctly render a "Sign In to Borrow/Reserve/Enroll" link to `/auth/login?redirect=...` instead of opening the real action for an anonymous visitor — clean, no silent-failure UX |
| Public course preview | `app/(public)/courses/[id]/_components/course-preview-view.tsx`, `app/api/courses/[id]/route.ts:49-56` | Shows only metadata (title/instructor/description/lesson count/duration) — the API itself doesn't even `include` lesson content, just `_count.lessons` |
| Buy/Rent (PayPack) | `buy-confirm-modal.tsx` | Real integration (posts to `/api/orders`, polls status) — but only reachable from the authenticated branch, so anonymous visitors can't reach it either |

## Bugs — confirmed

1. **Raw resource file URLs (`documentUrl`/`audioUrl`/`videoUrl`) are exposed to anyone via `GET /api/resources` and `GET /api/resources/[id]`.** `app/api/resources/route.ts:73-75` — no auth call anywhere in the GET handler, and these three fields are unconditionally included in the serialized response for every resource, including paid ones. This is a real, verified bypass of the otherwise-correct `/document`/`/download` proxy gating: an anonymous visitor doesn't need to defeat those proxies at all — they can read the direct Cloudinary file URL straight out of the public `/library` page's own network response (or a bare `curl`), then fetch the file directly from Cloudinary. **Fix direction**: omit these three fields from the public/anonymous list-serializer, and only ever reveal them through an already-gated route.

2. **`GET /api/lessons` and `GET /api/lessons/[id]` have no auth check and return full lesson content to anyone.** `app/api/lessons/route.ts:21-43`, `[id]/route.ts:20-27` — confirmed no `getServerSession`/`requireStaff`/any auth call on GET in either file; `content`/`contentMarkdown` are returned in full for any lesson, published or draft, paid or free course, to an anonymous caller who supplies a real `courseId` (trivially obtainable — `GET /api/courses` is also open). The public course-preview page itself is a fine teaser (only renders a count), but this is the same class of bug as finding #1: the UI's restraint doesn't matter if the API underneath has no gate at all. This duplicates and confirms the E-Learning investigation's earlier finding — it's not unique to the public pages, but the public course-preview page is a second real, live-reachable path to it.

## Mocked / not yet built

- **Home page stats are fully invented** — `app/page.tsx:114-127` — "195+ Countries," "2M+ Downloads," "4.9/5 Rating" have zero backing data anywhere in the schema (no download/rating tracking model exists). Harmless as marketing copy but worth knowing these are not real metrics if anyone ever treats them as such.
- **Testimonials are hardcoded** — `app/page.tsx:40-88` — three named testimonials with zero backend. Expected/fine for marketing copy.
- **Newsletter signup has no backend** — `components/home/newsletter-section.tsx:31-34` — `onSubmit` is a 400ms fake delay then a static success message; no real API call, no persistence. The code comment explicitly documents this as an intentional no-backend stub, so it's not a hidden bug, but it isn't called out anywhere in CLAUDE.md/PROGRESS.md either.
- **No About/Contact/Terms/Privacy pages exist** — confirmed absent under `app/(public)/**`. `components/main-footer.tsx:35-45` has an explicit comment documenting that a "Help" column (Support/Contact/FAQ) was deliberately removed rather than left as dead links, since no such page exists yet — a clean intentional decision, not an oversight.
- **No admin "featured content"/homepage-curation control exists.** `app/dashboard/settings/_components/settings-schema.ts` only covers borrow/reservation policy numbers. The public library/course pages are entirely query-driven (all matching resources/courses, no curation layer) — confirmed absence, worth flagging only if "featured" curation was expected per spec.

## Suspicious / worth a second look

- **Registration doesn't auto-sign-in, despite `auth-context.tsx` suggesting it should.** `app/(public)/auth/register/page.tsx:43-51` calls `fetch('/api/auth/register')` directly rather than `useAuth().register()`. `auth-context.tsx`'s own `register()` function has a JSDoc implying auto-login is the intended UX ("Creates a real member account… then signs them in immediately"), but the actual register page ignores that function entirely and just shows a static "you can now sign in" message. Not broken (register → manual login still works end-to-end), but a real discrepancy between documented intent and shipped behavior — worth checking whether any other caller actually uses `useAuth().register()`, or whether it's dead code.
- **Language switcher is real Google Translate, not decorative.** `components/language-switcher.tsx` — injects Google's `translate_a/element.js` widget, drives the hidden `.goog-te-combo` select, sets a `googtrans` cookie, reloads the page. This has a genuine functional effect (machine-translates the page), which contradicts the *impression* CLAUDE.md's "i18n isn't wired up anywhere" gives, even though it's technically a separate, real, third-party mechanism from the unused `locales/*.json` files. Worth flagging to whoever owns CLAUDE.md so a future reader doesn't assume the language switcher does nothing.
- **`Publication` (Publishing module) records may have the same raw-file-URL exposure pattern as resources** — not fully verified in this pass (only referenced via `usePublications()`/`publication-detail-view.tsx:39`), but given finding #1's pattern, worth a dedicated check of `app/api/publications/route.ts`'s GET serializer.
- **No public About/Contact/Research/News/blog page** — confirmed, and consistent with CLAUDE.md's documented scope (none of the 6 "Coming Soon" Phase-9 modules have any public page). Not a gap, just confirming nothing unexpectedly leaked out ahead of schedule.
