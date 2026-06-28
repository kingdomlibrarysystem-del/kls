# KINGDOM LIBRARY SYSTEM DEVELOPMENT RULES

---

# 1. Technology Stack Rules

## Mandatory Technologies
First of all undersand project go through files.
Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## colors in the project
please use colors defined in global.css [C:\Users\B Sostene\Desktop\Dev_clients\KKH\kingdom-library-system\app\globals.css] never use autside colors 

Preferred UI Library:
- Shadcn UI

Custom Components:
- Use only for domain-specific features and layouts.

Use Shadcn UI for:
- Button
- Input
- Select
- Dialog
- Sheet
- Dropdown Menu
- Tabs
- Table wrappers
- Form controls

Use custom components for:
- Sidebar
- Dashboard cards
- Statistics widgets
- Resource cards
- Book cards
- Analytics sections
- AI assistant panels
- Domain-specific layouts

Avoid introducing multiple UI libraries.

Backend:
- Next.js API Routes
- Server Actions (Internal Dashboard Operations)

Database:
- PostgreSQL

ORM:
- Prisma

Authentication:
- JWT Access Token
- JWT Refresh Token
- Token Rotation

Tables:
- TanStack Table

Forms:
- React Hook Form
- Zod

Charts:
- Recharts

File Storage:
- Cloudinary

Deployment:
- Vercel

AI Integration:
- Chatbase

Email Service:
- Nodemailer

Background Jobs:
- BullMQ

---

# 2. Architecture Rules

Modules must be separated by domain.

Example:

folder/
├── auth
├── users
├── roles
├── permissions
├── books
├── borrow
├── inventory
├── members
├── publications
├── research
├── e-learning
├── beauty
├── counseling
├── rehabilitation
├── analytics
├── notifications

Shared folders:

components/
hooks/
types/
validators/
services/
repositories/
lib/
constants/

---

# 3. Database Design Rules

## Dynamic Data First

on role, permission, categories, tags, Table resource_types, Table resource_formats, scrolls  Never use static enums for business data managed by admins. while status should be enums (static).

### ❌ Avoid

```ts
enum Role {
  ADMIN,
  MANAGER,
  MEMBER
}
```

### ✅ Use Tables

- roles
- permissions
- categories
- tags
- settings

Admins must be able to:

- Create roles
- Update roles
- Delete roles
- Create permissions
- Assign permissions
- Create categories
- Create tags
- Configure settings

example role and permission

role is publisher

RolePermission
Role	Permission
publisher	publication:create
publisher	publication:update
publisher	publication:view

---

## Relationship Rules

Always use proper relationships.

User → Role

Role → Permissions

Course → Lessons

Course → Enrollments

Publication → Contributors

Resource → Category

Resource → Tags

Borrow → Resource

Borrow → User

---

## Database Standards

Use UUID as primary key.

Every table must contain:

- createdAt
- updatedAt

Optional:

- deletedAt (soft delete)
- I recommend: deletedAt DateTime? and deletedBy String?

Create indexes on searchable fields.

Use transactions for:

- Borrowing
- Returning
- Payments
- Inventory updates

---

# 4. Server Component Rules

Server Components are the default.

### Every page.tsx must remain a Server Component.

Never add:

```tsx
"use client";
```

inside page.tsx unless there is a very strong reason.

---

## Use Client Components only for:

- useState
- useEffect
- Browser APIs
- Interactive forms
- Charts
- Data tables
- Modals
- Dropdowns

Create separate client components:

```txt
page.tsx

_components/
    create-book-form.tsx
    books-table.tsx
    analytics-chart.tsx
```

---

## Preferred Pattern

Server Component:

```tsx
page.tsx
```

Client Components:

```txt
_components/
```

This improves:

- Performance
- SEO
- Initial loading speed
- Scalability

---

# 5. API Rules

normaly Use API Routes

Examples:

```txt
/api/auth
/api/users
/api/books
/api/publications
/api/courses
```

---

Use Server Actions for Admin Dashboard CRUD operations

Avoid unnecessary fetch("/api/...") calls inside dashboard pages.

---

# 6. Database Query Rules

Prefer:

```ts
select
```

over:

```ts
include
```

Avoid overfetching.

Avoid N+1 queries.

Always paginate large datasets.

---

# 7. File Size Rules

Preferred size:

200–300 lines.

Split files when:

- Responsibility increases.
- Readability decreases.
- Multiple concerns appear.

Split into:

- services
- repositories
- validators
- helpers
- hooks
- components

---

# 8. Component Management Rules

Global components:

```txt
components/
```

Examples:

```txt
components/
├── ui
├── forms
├── tables
├── charts
├── shared
```

Private components:

```txt
app/library/_components
app/users/_components
app/books/_components
```

Private components should remain close to their route.

---

# 9. API Response Standard

Every API response must follow:

```ts
{
  data: any | null,
  message: string,
  code: "success" | "error",
  status: number
}
```

Success:

```ts
{
  data: user,
  message: "User created successfully",
  code: "success",
  status: 201
}
```

Error:

```ts
{
  data: null,
  message: "Email already exists",
  code: "error",
  status: 409
}
```

---

# 10. Pagination Rules

Every list endpoint must support:

```txt
?page=1
&pageSize=10
&search=
&sortBy=
&sortOrder=
```

Response:

```ts
{
  data: [],
  message: "Fetched successfully",
  code: "success",
  status: 200,

  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 100,
    totalPages: 10,
    hasNext: true,
    hasPrevious: false
  }
}
```

---

# 11. TypeScript Rules

Strict mode is mandatory.

```json
{
  "strict": true
}
```

Avoid:

- any
- unknown

unless there is a very strong reason.

---

Create reusable types.

```txt
types/
├── user.types.ts
├── role.types.ts
├── permission.types.ts
├── course.types.ts
├── resource.types.ts
├── borrow.types.ts
```

---

# 12. Validation Rules

Never trust frontend data.

All inputs must use Zod.

Examples:

- Login
- Registration
- Course creation
- Borrow requests
- Payments

---

# 13. Form Rules

Always use:

- React Hook Form
- Zod
- Server Actions

Avoid manual form handling.

---

# 14. Table Rules

All tables must use:

TanStack Table

Features:

- Pagination
- Sorting
- Filtering
- Search
- Column visibility
- Row selection

Reusable table components should be stored in:

```txt
components/tables
```

---

# 15. Security Rules

Authentication:

- JWT Access Token
- JWT Refresh Token
- Token Rotation
- Email Verification

Authorization:

- RBAC
- Permission-based access

Never hardcode secrets.

Store only in:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET=
EMAIL_API_KEY=
OPENAI_API_KEY=
```

---

# 16. Authorization Rules

Never check permissions inside UI components.

Authorization belongs to:

- middleware
- services
- server actions

Not inside JSX.

---

# 17. Audit Logging Rules

Create logs for:

- Login
- Logout
- Password reset
- User creation
- Role assignment
- Borrow approval
- Publication approval
- Payment transactions

---

# 18. Notification Rules

Notifications must go through a centralized service.

Channels:

- Email
- In-App

Events:

- Borrow approved
- Reservation available
- Course enrollment
- Publication approval
- Due reminders
- Payment success

---

# 19. Internationalization Rules

Supported languages:

- English (en)
- French (fr)
- Kinyarwanda (rw)

Never hardcode text.

Use:

```txt
locales/
├── en.json
├── fr.json
├── rw.json
```

---

# 20. Performance Rules

Use:

- Prisma select fields
- Database indexes
- Pagination
- Lazy loading
- Image optimization
- Dynamic imports
- Server Components

Optimize images with:

```tsx
next/image
```

Avoid:

```html
<img>
```

unless necessary.

---

Cache expensive queries.

Use:

- React cache()
- unstable_cache()
- revalidateTag()
- revalidatePath()

---

Use queues for:

- Emails
- Notifications
- Certificate generation
- AI jobs

---

# 21. Error Handling Rules

Every module should have:

```txt
loading.tsx
error.tsx
not-found.tsx
```

Use:

- try/catch
- custom error classes

---

# 22. Git Rules

Branch examples:

```txt
feature/authentication
feature/library-management
feature/e-learning
bugfix/login-issue
```

Commit format:

```txt
feat:
fix:
refactor:
docs:
test:
```

Example:

```txt
feat(auth): implement refresh token rotation
```

---

# 23. AI Development Rules

Before modifying any file:

1. Read the file.
2. Understand the task.
3. Modify only related files.
4. Preserve existing functionality.
5. Avoid unrelated changes.
6. Follow project architecture.

---

# 24. Code Quality Rules

Always follow:

- DRY
- SOLID Principles
- Reusable Components
- Reusable Hooks
- Reusable Services
- Reusable Validators
- Reusable Types

Never:

- Duplicate code
- Hardcode values
- Mix business logic inside UI components
- Create unnecessary files

---

# 25. Documentation Rules

Document:

- Purpose
- Endpoints
- Models
- Permissions
- Dependencies

---

# 26. Future Scalability Rules

Every module must support:

- Multi-role access
- Multi-language content
- AI integration
- Notifications
- Audit logs
- Analytics
- Payments

without major database redesign.

---

These rules are designed to support the entire Kingdom Library ecosystem, including:

- Authentication
- Library Management
- Borrowing
- Inventory
- Publishing
- Research
- E-Learning
- AI Assistance
- Notifications
- Analytics
- Payments
- Beauty Services
- Consultation & Counseling
- Rehabilitation Services

while maintaining scalability, performance, maintainability, and enterprise-level architecture.
````

I would further add **Repository Pattern Rules**, **Caching Rules**, and a **Folder Structure Rules section** because with a project as large as Kingdom Library, these three become extremely important.


