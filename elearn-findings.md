# E-Learning — Admin/Member Deep Dive Findings

A code-verified audit of the E-Learning module: Courses, Lessons, Quizzes/
Assessments, Enrollment, Certificates, and Session Requests/Rooms, across
both `app/dashboard/e-learning/**` (admin) and `app/member/**` (member).
Every claim below was confirmed by directly reading the cited file.

## TL;DR

- **The module is substantially real, further along than Digital Library.**
  Course/Lesson/Assessment CRUD, self-enrollment, paid checkout (PayPack +
  Stripe), lesson progress, quiz auto-grading + manual grading queue,
  certificate auto-issuance, and session-request booking with a real
  "wait for host" LiveKit gate are all genuinely wired end-to-end.
- **Confirmed security bug, the most serious finding in this report: quiz
  and exam answer keys are exposed to any signed-in member.** `GET
  /api/assessments` and `GET /api/assessments/[id]` only require
  `requireAuth()` (any authenticated user, any role) and always serialize
  `correctOptionIndex`/`correctOptionIndices` for every question. The
  member take-quiz page fetches this exact same endpoint and caches the
  full response client-side — a member can read the answer key via
  DevTools or a direct `fetch()` before or during taking the quiz. I
  verified this myself by reading both route files and the member-side
  fetch hook, not just relayed from an agent.
- **A second real gap in the same family**: lesson and course content has
  no server-side entitlement check at all — `GET /api/courses` and `GET
  /api/lessons` require no auth whatsoever, so an anonymous caller can
  read full lesson content for a paid course without enrolling or paying.
  The enroll write path correctly blocks free-enrollment into a priced
  course, but that's the only real gate — reads bypass it entirely.
- **CLAUDE.md/PROGRESS.md's Phase 5 "blocked on mock auth" entries are
  now stale**, same finding as the Digital Library investigation — real
  NextAuth is wired in, and every previously-documented E-Learning
  blocker (enroll, mark-lesson-complete, take-quiz, certificate issuance,
  session-request creation) is now live, per a later fix-batch that
  wasn't reflected back into those earlier doc entries.
- Smaller gaps: no quiz/exam attempt-limit enforcement (unlimited
  resubmission), no member self-service "cancel my session request,"
  Certificate "download" is an honest print-to-PDF affordance (not a
  bug — explicitly documented in its own code comment).

## Working — Admin (`app/dashboard/e-learning/**`)

| Feature | File | Evidence |
|---|---|---|
| Course Catalog CRUD | `app/api/courses/route.ts`, `[id]/route.ts` | Real create/update; `DELETE` exists, blocked with 409 if `Enrollment` rows exist |
| Course Catalog admin UI | `catalog/_components/catalog-view.tsx` | Add/Edit/Archive all real; lecturer dropdown = real `/api/users`, cover image = real Cloudinary upload (fixed earlier this session) |
| Lessons CRUD | `app/api/lessons/route.ts`, `[id]/route.ts` | Real create/read/update/delete, `requireStaff()` on writes |
| Lesson content authoring | `components/ui/markdown-editor.tsx:34-46` | Toolbar image button does a real signed Cloudinary upload; video via pasted YouTube link rendered as a real `<iframe>` — genuinely real, not dead |
| Quizzes/Assessments CRUD | `app/api/assessments/route.ts`, `[id]/route.ts` | Full create/read/update/delete of quiz/exam/project with embedded questions, `requireStaff()` on writes |
| Auto-grading | `app/api/assessment-attempts/route.ts:121-138` | Real server-side scoring for SINGLE/MULTI_SELECT; OPEN questions correctly routed to `PENDING_REVIEW` |
| Manual grading (Review Queue) | `app/api/assessment-attempts/[id]/route.ts` (`gradeOpenAnswers`) | Real, staff-only, guarded to `PENDING_REVIEW` only (409 otherwise), finalizes PASSED/FAILED, re-triggers certificate eligibility, sends real email |
| Enrollment admin listing | `enrollments/_components/enrollments-view.tsx` | Real `GET /api/enrollments`, real computed progress |
| Certificate eligibility + issuance | `app/api/_shared/issue-certificate-if-eligible.ts` | Real: requires `Enrollment.status === COMPLETED && assessmentPassed === true`, dedupes per user+course, generates a real verification code, sends real email |
| Certificate admin (list/revoke/restore) | `app/api/certificates/route.ts`, `[id]/route.ts` | Real, `requireStaff()`-gated; public verify-by-code intentionally unauthenticated |
| Session Requests (approve/reject/complete/mark-unavailable/notify) | `app/api/session-requests/[id]/route.ts` | Real, guarded status transitions (409 on invalid transition), real notifications/emails |
| Session Room "wait for host" gate | `app/api/session-requests/[id]/livekit-token/route.ts:44-50` | Real server-side `isHostPresent()` check against real `SessionPresence` rows before issuing a learner a join token; admin has its own real room entry point |
| Auth on all of the above | `lib/auth/require-role.ts` | `requireAuth`/`requireStaff`/`requireOwnerOrStaff` genuinely used via `getServerSession` throughout — confirmed directly, not from docs |

## Working — Member (`app/member/**`)

| Feature | File | Evidence |
|---|---|---|
| Course browse/search/filter | `app/member/e-learning/page.tsx` | Real `useCourses()` fetching `GET /api/courses?status=PUBLISHED` |
| Self-enroll (free courses) | `use-enrollments.ts:69-78` | Real `POST /api/enrollments` with session `user.id`; blocks double-enroll (409, unique constraint) and blocks free-enroll into a priced course (400 unless `price === 0`) |
| Paid checkout (PayPack + Stripe) | `course-checkout-modal.tsx`, `app/api/course-orders/settle.ts` | Real two-rail flow: real `POST /api/course-orders`, PayPack phone-prompt polling, Stripe redirect to a real Checkout URL; idempotently upserts a paid `Enrollment` on success. PayPack rail fully live; Stripe code path is real but needs real secret keys to run (placeholders only in `.env`) |
| Unenroll | `enrollment-action-button.tsx` | Real `PATCH /api/enrollments/[id]` → `status: DROPPED` |
| Lesson viewing / mark-complete progress | `lesson-viewer-view.tsx:42-52` | Real `PATCH /api/enrollments/[id]` (`completeLesson`); server recomputes `completedLessonIds`/progress, auto-flips `status: COMPLETED` |
| Quiz/Exam submission | `take-assessment-view.tsx:50-61`, `app/api/assessment-attempts/route.ts:83-168` | Real `POST`; server grades objective questions, computes PASSED/FAILED at 50%, routes OPEN/PROJECT to `PENDING_REVIEW`, auto-flips certificate eligibility on an auto-graded pass |
| Certificate auto-issuance + member view | `issue-certificate-if-eligible.ts`, `certificate-detail-view.tsx` | Real, triggered from every eligibility-flipping write path; member view fetches real `GET /api/certificates/:id` |
| Session Request booking | `request-session-modal.tsx:56-62` | Real `POST /api/session-requests` with real `learnerId`, lecturer resolved from real `Course.lecturerId` |
| Session Room join, "wait for host" | `/member/sessions` → `SessionCard` → `/member/sessions/[id]/room` | End-to-end reachable: real join-window gating, real LiveKit token route with the same host-presence check as admin; client polls/retries on a real 503 `host-not-present` |

## Bugs — confirmed

1. **Quiz/exam answer keys leak to any signed-in member.** `app/api/assessments/route.ts:47-49` and `app/api/assessments/[id]/route.ts:40-42` — `GET` calls only `requireAuth()`, not `requireStaff()`, and `serializeAssessment()` (lines 14-45 in both files) unconditionally includes `correctOptionIndex`/`correctOptionIndices` for every question, regardless of caller role. The member take-quiz flow (`app/member/_shared/use-assessments.ts:25`) fetches this exact endpoint (`/api/assessments?pageSize=1000`) and caches the full response client-side. **Verified directly by reading both route files and the member fetch hook** — a member can read a quiz/exam's correct answers before or during taking it via a direct `fetch()` call or the browser's network tab. This needs a role-aware serializer (strip `correctOptionIndex(es)` unless the caller is staff) before this module should be considered production-safe.

2. **Course/lesson content has no server-side entitlement check.** `app/api/courses/route.ts` and `app/api/lessons/route.ts` — `GET` has no auth call at all in either file. Combined with `lesson-viewer-view.tsx` never checking `enrollment.paid` (or that an enrollment even exists) before rendering full lesson content, and the lesson page having zero server-side check — an anonymous, unauthenticated caller can `GET /api/lessons?courseId=<paidCourseId>` and read full lesson content for any course, including priced ones, without enrolling, paying, or signing in. The `Enrollment.paid` gate described in the schema's own docstring (`prisma/schema.prisma:832-839`) is not actually checked by the one real content-read path that exists — the only real gate today is on the *enroll* write path, not on content reads.

3. **No quiz/exam attempt-limit enforcement.** `Assessment`/`AssessmentAttempt` models have no `maxAttempts` or attempt-count field, and `POST /api/assessment-attempts` never checks prior attempts before creating a new one — a member can resubmit a quiz/exam indefinitely. Not documented as a known gap anywhere; simply not built.

## Mocked / not yet built

- **Certificate "download" is print-to-PDF only** — `certificate-detail-view.tsx:21,105` — explicitly documented in its own comment as an honest, intentional limitation ("no real file-generation backend exists yet"), not a bug.
- **Course price has no admin form control** — `course-form-schema.ts`/`course-form-view.tsx` have no `price` field, even though `Course.price` and the API schemas accept it. Matches PROGRESS.md's own documented scope-cut: an admin can set price via a direct PATCH today, but there's no dashboard UI for it.
- **Progress/Analytics page** (`app/dashboard/e-learning/progress/**`) — still mock (`progress-data.ts`), explicitly out of Phase 5's scope per PROGRESS.md, deferred to a later phase.
- **No member self-service "cancel my session request."** Every action on `PATCH /api/session-requests/[id]` (`approve`/`reject`/`complete`/`mark-unavailable`/`notify`) is `requireStaff()`-gated — a learner who wants to withdraw a `PENDING` request has no API path to do so themselves, unlike Unenroll which did get a real member-facing action in the same fix batch.

## Suspicious / worth a second look

- **Hard-delete course API exists with zero UI entry point.** `DELETE /api/courses/[id]` is fully implemented and guarded, but no button anywhere in the Catalog admin UI calls it — only Archive (which actually reverts status to `DRAFT`, not a distinct archived state) is exposed. Worth confirming whether soft-archive-only is intentional.
- **Enrollment admin view is read-only** — list + detail only, no manual enroll/revoke/refund button, even though the underlying API (`unenroll` action, `DELETE`) supports it.
- **Dead/unreachable enum value**: `updateCourseSchema` accepts `status: 'ARCHIVED'` but the Prisma `CourseStatus` enum only defines `DRAFT`/`PUBLISHED` — would throw at the Prisma layer if ever sent literally. Not currently reachable (the one caller sends `'DRAFT'`), but latent.
- **Stale docstring** in `use-certificates-admin.ts:16-22` still claims certificate issuance "stays on the mock ... blocked member enrollment write path" — false today; issuance is real. Cosmetic, but could mislead a future reader.
- **`RequestSessionModal`'s notification side-effect** (`request-session-modal.tsx:9,65-92`) still calls an older `addNotification()` admin-notification helper rather than the newer real `notifyUser()`/SSE pipeline the rest of the notification system was hardened onto — the session request itself is real, but staff may not get an email/live SSE push for a new request the way they do for approve/reject/reminder notifications.
- **Auth-gating is inconsistent across this module's own GET routes**: `courses`/`lessons` = no auth; `assessments` = any signed-in user (the answer-leak bug above); `enrollments`/`certificates`/`assessment-attempts`/`session-requests` = properly owner-or-staff scoped. This looks like an accident of file-by-file authorship rather than a deliberate public-vs-gated design — worth a single pass to make the intended boundary explicit and consistent.
- **Doc drift, confirmed**: PROGRESS.md's Phase 5 entry describing these write paths as blocked on mock auth is superseded by a later, undocumented-back-into-that-entry fix batch (commits matching `feat(courses): real Unenroll + real PayPack/Stripe...` and `feat(session-room): real "wait for host" gate...`). Not a functional problem, just worth reconciling so a future reader doesn't trust the earlier entry at face value.
