# Kingdom Library System

A multilingual digital library management platform built for Rwanda, supporting library management, e-learning, publishing, research, and AI assistance.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT Access Token + Refresh Token + Email Verification |
| File Storage | Cloudinary |
| Email | Resend / Nodemailer |
| Queue | BullMQ |
| AI | OpenAI / Chatbase |
| Deployment | Vercel |

---

## Key Rules (from RULES.md)

- No static enums for business data — roles, permissions, categories, statuses are all dynamic database tables managed by admins
- UUID primary keys on every table
- Every table has `createdAt`, `updatedAt`; soft deletes via `deletedAt` where needed
- Every API response follows `{ data, message, code, status }` with pagination `{ page, pageSize, totalItems, totalPages, hasNext, hasPrevious }` on list endpoints
- TypeScript strict mode — no `any` / `unknown` without strong justification
- Validation via Zod on every input
- All text uses i18n translation files (`locales/en.json`, `fr.json`, `rw.json`) — no hardcoded strings
- Max 300 lines per file — split into service / helper / validator / repository / hooks / components
- Global components live in `components/` — private components live inside the route folder (e.g. `app/library/_components/`)
- Audit logs for all sensitive actions (login, borrow approval, payments, role changes)
- RBAC + permission-based access control
- No secrets hardcoded — all in `.env`

---

## Project Structure

```
app/
├── (public)/
│   ├── auth/           # register, login, forgot-password, verify-email
│   └── library/        # public book browsing
├── api/
│   ├── resources/      # GET/POST resources
│   ├── users/          # GET/POST users
│   ├── borrowings/     # GET/POST borrowings
│   └── categories/     # GET/POST categories
├── dashboard/
│   ├── admin/          # admin panel
│   ├── library/        # member library view
│   ├── borrowings/     # active borrowings
│   ├── reservations/   # reservations
│   └── profile/        # user profile

components/
├── ui/                 # global reusable UI components
├── home/               # landing page sections
├── main-header.tsx
└── main-footer.tsx

prisma/
├── schema.prisma       # full dynamic schema
└── seed.ts             # seed roles, permissions, statuses, sample data

locales/
├── en.json
├── fr.json
└── rw.json

types/
├── user.types.ts
├── role.types.ts
├── resource.types.ts
└── ...
```

---

## Database Design (highlights)

Dynamic tables instead of enums:

- `Role`, `Permission`, `RolePermission` — admin-managed RBAC
- `AccountStatus`, `BorrowStatus`, `ReservationStatus`, `FineStatus` etc. — all configurable
- `Category`, `Tag` — multilingual JSON fields `{ en, fr, rw }`
- `AuditLog` — tracks all sensitive actions
- `Setting` — platform-wide configuration store

---

## API Response Standard

```json
{
  "data": [],
  "message": "Resources fetched successfully",
  "code": "success",
  "status": 200,
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Getting Started

```bash
npm install
cp .env.example .env      # fill DATABASE_URL and secrets
npm run dev               # http://localhost:3000
npm run seed              # seed roles, permissions, statuses
```

---

## Languages Supported

English · Français · Kinyarwanda

---

## Modules

1. Authentication — register, login, email verify, password reset, JWT rotation
2. Digital Library — browse, borrow, reserve, manage inventory
3. Publishing — submission → review → approval → publish workflow
4. E-Learning — courses, lessons, enrollments, progress, certificates
5. Research — projects, papers, repository
6. Admin — user management, role/permission CRUD, audit logs, settings
7. Notifications — email + in-app (borrow approved, due reminders, payment success)
8. Payments — fine collection, revenue tracking
9. AI Assistant — OpenAI / Chatbase integration
