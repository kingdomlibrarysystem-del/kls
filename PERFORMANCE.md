# Dashboard Architecture & Backend Integration Rules

## Purpose

The Kingdom Knowledge Hub dashboard is a large enterprise dashboard containing multiple modules, statistics panels, resource listings, analytics widgets, and service sections. Because of its size and complexity, developers and AI assistants must follow strict architectural rules when implementing backend logic, database queries, and data fetching processes.

Failure to follow these rules may result in:

* Excessive database queries
* Slow page loading
* Poor scalability
* Duplicate logic
* High server costs
* Difficult maintenance

---

# Rule 1: Never Fetch Dashboard Data Component-by-Component

The dashboard contains many independent sections that require data from different modules.

Examples:

* Welcome Section
* Borrow & Return
* Inventory Overview
* Research Services
* Publishing Services
* Members Statistics
* Resources Center
* Reports & Analytics

AI MUST NOT generate code where every component performs its own database query during page load.

❌ Bad Example

BorrowReturn.tsx

* Queries borrows

InventoryOverview.tsx

* Queries resources

MembersPanel.tsx

* Queries users

ReportsPanel.tsx

* Queries reports

This creates multiple database round-trips and significantly increases page load time.

---

# Rule 2: Use Centralized Dashboard Services

All dashboard statistics must be aggregated through dedicated backend services.

Example:

services/dashboard/dashboard.service.ts

Functions:

* getDashboardStats()
* getInventoryStats()
* getMemberStats()
* getBorrowStats()
* getResourceStats()

The dashboard page should consume aggregated data rather than directly accessing the database.

---

# Rule 3: Use Database Transactions for Dashboard Counts

Whenever multiple counts or statistics are required, use a single transaction.

Preferred approach:

* Prisma $transaction
* Database aggregation queries
* Grouped count operations

Benefits:

* Fewer database round-trips
* Faster response times
* Better scalability

AI must always prefer a single aggregated request over multiple independent requests.

---

# Rule 4: Separate Dashboard Statistics from Dashboard Content

Statistics and content have different loading requirements.

Statistics:

* Total Members
* Total Resources
* Active Loans
* Reservations
* Research Projects

Content:

* Recent Loans
* Popular Resources
* News Articles
* Recently Added Resources

Statistics should be fetched first.

Heavy content should be loaded independently.

---

# Rule 5: Prefer Server Components

Components that only display data must remain Server Components.

Examples:

* Statistics Cards
* Inventory Overview
* Resource Lists
* Dashboard Summaries

Do not use client-side rendering when server-side rendering is sufficient.

---

# Rule 6: Use Client Components Only for Interactive Features

"use client" should only be used when browser interaction is required.

Valid examples:

* Search Bar
* AI Assistant Chat
* Filters
* Sorting Controls
* Live Notifications
* Form Wizards

Invalid examples:

* Statistics Cards
* Read-Only Tables
* Overview Panels

---

# Rule 7: Use Suspense for Heavy Dashboard Sections

Large datasets must not block the entire dashboard.

Examples:

* Recent Borrow Activity
* Popular Resources
* Research Activity
* Publishing Activity

These sections should load independently using Suspense boundaries.

Benefits:

* Faster perceived performance
* Progressive rendering
* Better user experience

---

# Rule 8: Never Query the Same Data Twice

Before generating code, AI must check whether the required data already exists in:

* Dashboard Service
* Shared API
* Existing Query
* Existing Context Provider

Duplicate queries are prohibited.

---

# Rule 9: Build Real Modules Only

AI must never generate fake production data.

If a module does not exist in the database schema:

* Display "Coming Soon"
* Display placeholder state
* Display empty state

Do not create hardcoded fake statistics.

Examples:

* Beauty & Wellness
* Rehabilitation
* Store
* News

must only display real data when the corresponding backend module exists.

---

# Rule 10: Every Dashboard Widget Must Have a Data Source

Before implementing a widget, AI must verify:

1. Which table supplies the data.
2. Which service provides the data.
3. Which API endpoint exposes the data.
4. Which role can access the data.

If no data source exists, implementation must stop and request clarification.

---

# Rule 11: Follow the Dashboard Dependency Map

Dashboard data should be grouped by domain.

Library Domain

* Resources
* Borrows
* Reservations

Membership Domain

* Members
* Profiles
* Roles

Research Domain

* Projects
* Publications
* Collaborations

Publishing Domain

* Books
* Journals
* Manuscripts

Learning Domain

* Courses
* Students
* Certificates

Analytics Domain

* Reports
* Metrics
* Trends

AI must fetch data by domain rather than per widget.

---

# Rule 12: Backend Logic Must Be Service-Driven

Components must never contain business logic.

Correct architecture:

UI Layer
↓
Server Component
↓
Application Service
↓
Repository Layer
↓
Database

Business logic belongs in services.

Database access belongs in repositories.

UI components only display data.

---

# Rule 13: Design for Future Expansion

The Kingdom Knowledge Hub is a multi-service ecosystem.

Future modules include:

* Research Services
* Publishing Services
* Beauty & Wellness
* Counseling
* Rehabilitation
* AI Services
* E-Learning

AI-generated code must remain modular and extensible.

Hardcoded assumptions are prohibited.

---

# Rule 14: Dashboard Performance Target

All dashboard requests should aim for:

* Initial render under 2 seconds
* Statistics load under 500ms
* Database query count minimized
* Aggregations optimized
* Reusable caching when appropriate

Performance is a requirement, not an enhancement.

---

# Final Principle

The dashboard is not a collection of independent widgets.

It is a unified ecosystem dashboard.

AI must always prioritize:

1. Centralized services
2. Minimal database round-trips
3. Server-side rendering
4. Modular architecture
5. Real data sources
6. Future scalability

Whenever there is a conflict between speed of implementation and architectural quality, architectural quality must be chosen.
