KINGDOM LIBRARY SYSTEM
DIGITAL LIBRARY | RESEARCH | E-LEANING | PUBLISHING | WELLNESS | COUNSELING |
REHABILITATION
Introduction
The Kingdom Knowledge Hub (KCS Platform) is an integrated digital knowledge management
platform designed to provide a centralized environment for learning, research, publishing, and
intelligent knowledge access. As organizations and educational institutions increasingly rely on
digital technologies to manage information and deliver services, there is a growing need for a
comprehensive system that combines digital library resources, e-learning capabilities, research
support, publishing services, and artificial intelligence assistance within a single platform.
The platform will serve a wide range of users including students, researchers, educators,
publishers, librarians, and administrators. Through its modern and scalable architecture, the
Kingdom Knowledge Hub seeks to enhance knowledge sharing, improve learning experiences,
support research innovation, and promote digital transformation in education and information
management.
Main parts of KLS
1. Digital Library: To provide access to physical and digital resources including books,
eBooks, journals, magazines, audio, and video materials,
2. Borrowing & Reservation Services: To enable users to borrow, reserve, renew, and
return physical and digital resources while tracking availability and due dates.
3. Publishing Services: To provide a platform where authors can submit books for publication
and distribution while allowing revenue sharing between publishers and platform administrators.
4. E-Learning Services: To support online learning through courses, lessons, assessments,
certifications, and learner progress tracking.
6. AI Assistance: To provide intelligent search, recommendations, automated support, and
knowledge discovery services.
7. Multilingual Accessibility: To support English, French, and Kinyarwanda across the
platform.
Research Support: To facilitate research activities through research repositories, project
management, and resource discovery tools.
8. Beauty & Wellness
9. Consultation & Counseling
10. Rehabilitation
11. Community Hub
KLS Roles Management
Role Description
admin Full platform control
Manager Handles all operational activities: (Library, Publishing, Research, E-learning,
Store, Reports)
Staff Day-to-day operations: Borrow/return Inventory Content moderation User
support.
 Contributor Authors, Researchers
Member Student or reader
KLS Task Management (Agile Development)
PHASE 1: AUTHENTICATION, ROLES & PERMISSIONS
Task 1.1: Authentication Infrastructure Setup
This task focuses on establishing the foundational authentication architecture for the Kingdom Library
System. The system should implement JWT-based authentication using access tokens and refresh tokens
to provide secure and scalable user sessions. Authentication middleware must be configured to protect
private routes and APIs while ensuring only authenticated users can access authorized resources. The
infrastructure should support role-aware authentication, secure token validation, token expiration
handling, and session persistence across devices and browsers.
Task 1.2: User Registration and Login
This task involves implementing a standard registration and login system using email and password
authentication. New users should be able to create accounts by providing basic information such as full
name, email address, and password through a registration form.
Users who register directly through the platform without an invitation shall automatically receive the
Member role. The system must validate email uniqueness, securely hash passwords, and verify email
ownership through email verification before activating the account.
The login process shall support secure authentication using email and password, automatic session
generation, JWT access and refresh tokens, and secure account access.
Features:
• User registration using email and password.
• Email verification before account activation.
• Secure password hashing.
• Forgot password and password reset functionality.
• Login using registered email and password.
• Automatic assignment of Member role for self-registered users.
• JWT-based authentication and session management.
Task 1.3: Invitation-Based User Onboarding
This task focuses on creating an invitation management system that controls how privileged users join the
platform. The Super Admin should be able to invite Managers, while Managers should be able to invite
Staff and Contributors. The system should generate secure invitation links containing expiration
timestamps and verification tokens. Invited users must complete their profiles after accepting the
invitation before gaining access to platform features. Invitation status tracking and resend functionality
should also be included.
This invitation will be via email, amin will need email in request body then select role then press invite
button. Email owner will receive email message then click on accept invitation to create account then
redirect user to signup form page
Task 1.4: Access Token and Refresh Token Management
This task involves implementing secure token lifecycle management. The system should generate shortlived access tokens and long-lived refresh tokens upon successful authentication. Refresh tokens must be
securely stored and validated before issuing new access tokens. The platform should support token
revocation, token rotation, and automatic session renewal to improve security while maintaining a smooth
user experience. Here make sure token last long time as member is taking course or member is reading
book
Task 1.5: Two-Factor Authentication (2FA) on only admin, and manager Librarian role
This task focuses on enhancing account security through Two-Factor Authentication. Users should have
the option to enable or disable 2FA from their account settings. When enabled, users must provide a onetime verification code generated through email or authenticator applications after successful login.
Recovery codes should be generated to allow account recovery if users lose access to their authentication
devices. The system must validate verification codes securely and prevent unauthorized access attempts.
Task 1.6: Session and Device Management
This task involves tracking user sessions and registered devices. The platform should record information
about active devices, login locations, operating systems, and browsers. Users should be able to view their
active sessions and terminate sessions on unknown devices. This functionality helps improve account
security by allowing users to monitor and control account access.
Task 1.7: Login History and Security Auditing
This task focuses on maintaining a comprehensive audit trail of authentication activities. The system
should record successful logins, failed login attempts, account lockouts, password resets, and logout
events. Administrators should be able to review security logs for suspicious activities, monitor access
patterns, and investigate potential security incidents.
Task 1.8: User Profile Management
This task involves allowing users to manage their personal information and account preferences. Users
should be able to update profile details, upload profile pictures through Cloudinary, select preferred
languages, configure notification settings, and manage account preferences. The platform should validate
updates and maintain profile history where necessary.
PHASE 2: ROLE & PERMISSION MANAGEMENT
Task 2.1: Role Management System
This task focuses on implementing the role hierarchy used by the Kingdom Library System. The system
should support Super Admin, Manager, Staff, Contributor, and Member roles. Administrators should be
able to assign roles, update role information, and manage role relationships. The implementation must
ensure that role inheritance and access restrictions are properly enforced throughout the platform.
Task 2.2: Permission Management System
This task involves creating a granular permission framework that controls access to specific system
functionalities. Permissions should be grouped into categories such as User Management, Library
Management, Borrowing Services, Research Services, Publishing Services, E-Learning Services, and
Reporting. Roles should be associated with specific permissions, and middleware should enforce
permission validation before granting access to protected operations.
Task 2.3: User Administration
This task focuses on managing user accounts across the platform. Administrators and Managers should be
able to search users, filter users by role and status, activate accounts, suspend accounts, view account
activity, and manage account permissions. The system should maintain audit logs for all administrative
actions performed on user accounts.
PHASE 3: DIGITAL LIBRARY MANAGEMENT
Task 3.1: Resource Catalog Management
Build the core catalog system for all library resources books, eBooks, journals, magazines, audio, and
video. Each resource must store metadata including title, category, type (physical/digital), author,
publisher, publication year, quantity, available quantity, and status. Admins and Managers can add,
update, and remove resources while controlling visibility and availability.
Implementation Hints
1 Design a Resource model with a 'type' enum: BOOK, EBOOK, JOURNAL, MAGAZINE, AUDIO,
VIDEO, and a 'format' enum: PHYSICAL, DIGITAL.
2 Use Cloudinary for uploading cover images and digital file attachments (PDF, MP3, MP4).
3 Add a 'status' field: AVAILABLE, ARCHIVED, OUT_OF_STOCK — update automatically based on
quantity.
4 Implement full-text search using database LIKE queries or a search library like MeiliSearch /
Elasticsearch for fast lookup by title, author, or ISBN.
5 Add pagination and filtering (by category, type, format, status) on GET /resources endpoint.
Task 3.2: Resource Category & Tag Management
Manage categories (e.g., Science, History, Technology) and tags to organize library resources. Admins
can create, rename, and delete categories. Resources can be tagged for flexible cross-category discovery.
Tags and categories support multilingual labels (English, French, Kinyarwanda).
Implementation Hints
1 Create a Category model and a Tag model with many-to-many relationship to Resource.
2 Store multilingual labels as JSON: { en: 'Science', fr: 'Sciences', rw: 'Siyansi' }.
3 Prevent deletion of a category that still has resources assigned — return a descriptive error.
4 Expose GET /categories and GET /tags with resource counts for admin dashboard display.
Task 3.3: Digital File Access & Streaming
Enable secure access to digital resources. Members can read eBooks, listen to audio, or watch video
content through the platform. Access must be controlled — only members with active borrowing records
or purchased access can open digital files. Implement streaming for audio/video and PDF viewing inline.
Implementation Hints
1 Generate signed URLs (Cloudinary or S3 pre-signed) that expire after a set time window to prevent
hotlinking.
2 For PDF viewing, use a frontend library like PDF.js embedded in an iframe.
3 Store access logs: user_id, resource_id, accessed_at, duration — useful for analytics.
4 Restrict file download vs. stream-only based on resource settings set by the manager.
Task 3.4: Resource Inventory Management
Track physical resource stock levels. Staff can update inventory when new copies arrive, when items are
damaged, or when items are removed from circulation. The system must maintain available_quantity in
sync with active borrowings and reservations automatically.
Implementation Hints
1 Maintain two fields: total_quantity and available_quantity. Never let available_quantity go negative.
2 Create an InventoryLog model to record every stock change: reason, changed_by, timestamp.
3 Use database transactions when updating inventory alongside borrow/return operations to avoid race
conditions.
4 Trigger low-stock alerts (notification or dashboard badge) when available_quantity falls below a
configurable threshold.
PHASE 4: BORROWING & RESERVATION SERVICES
Task 4.1: Borrow Request & Approval
Allow members to request borrowing of physical or digital resources. The system checks availability,
creates a borrow record, and notifies Staff for approval. Staff approve or reject requests, update resource
availability, and notify the member. Borrowing records must track borrow_date, due_date, and status.
Implementation Hints
1 Borrow model fields: borrow_id, user_id (FK), resource_id (FK), borrow_date, due_date, return_date,
status (PENDING, APPROVED, REJECTED, RETURNED, OVERDUE).
2 When a borrow is approved, decrement available_quantity in a single transaction.
3 Use a configurable borrow period (default 14 days) stored in system settings.
4 Send email/in-app notification on approval or rejection using a queue (e.g., BullMQ or similar).
5 Enforce per-user borrow limits (e.g., max 3 items at once) — check before allowing new requests.
Task 4.2: Resource Return Processing
Handle resource returns submitted by members or processed by Staff. Upon return, the system updates the
borrow record's return_date and status, increments available_quantity, and checks whether any
reservations are waiting for that resource. Fine calculation for overdue returns should also be triggered.
Implementation Hints
1 On return, set status = RETURNED and record return_date. Calculate overdue days if return_date >
due_date.
2 After returning, query the Reservation table for the earliest pending reservation on that resource and
notify the waiting member.
3 Create a Fine model: fine_id, borrow_id, days_overdue, amount, status (UNPAID, PAID, WAIVED).
4 Allow Staff to waive fines with an audit log entry.
Task 4.3: Reservation Management
Enable members to reserve resources that are currently unavailable. The system places them in a queue
and notifies them when the resource becomes available. Reservations have an expiry window — if not
claimed, the next person in queue is notified.
Implementation Hints
1 Reservation model fields: reservation_id, user_id, resource_id, reservation_date, status (PENDING,
NOTIFIED, CLAIMED, EXPIRED, CANCELLED).
2 Use FIFO queue logic — order reservations by reservation_date ASC to notify the earliest request
first.
3 Set a configurable claim window (e.g., 48 hours) after notification — auto-expire if not claimed.
4 Prevent duplicate reservations: one active reservation per user per resource.
Task 4.4: Renewal Management
Allow members to renew active borrowings before the due date, extending the return deadline. Renewals
should be limited to a maximum number of times per borrow. The system must check whether a
reservation exists for that resource before allowing renewal.
\
Implementation Hints
1 Add renewal_count and max_renewals fields to the Borrow model.
2 Block renewal if renewal_count >= max_renewals or if another member has a pending reservation.
3 Each renewal extends due_date by the standard borrow period and logs the renewal event.
4 Members can request renewals via self-service or Staff can do it on their behalf.
Task 4.5: Borrowing History & Reports
Provide members with their full borrowing history and allow Managers and Staff to generate reports on
borrowing activity, overdue resources, top borrowed items, and fine collections. History must be
searchable and filterable.
Implementation Hints
1 Add dedicated report endpoints: GET /reports/overdue, GET /reports/top-resources, GET
/reports/fines.
2 Allow date range filtering and export to CSV/PDF for admin reports.
3 Members see only their own history; Staff and Managers see all records with filter options.
4 Add dashboard summary cards: total borrowed today, overdue items, pending returns.
PHASE 5: PUBLISHING SERVICES
Task 5.1: Book Submission by Contributors
Allow Contributors (authors/researchers) to submit books for publication. Submissions include metadata
(title, description, category, language, cover image) and the manuscript file. The system stores the
submission and notifies Managers for review.
Implementation Hints
1 Publication model fields: publication_id, contributor_id (FK), title, description, category, language,
cover_image_url, file_url, submission_date, status (DRAFT, SUBMITTED, UNDER_REVIEW,
APPROVED, REJECTED, PUBLISHED).
2 Upload manuscript files to Cloudinary or S3; store the URL. Validate file type (PDF only) and size
limit.
3 Allow Contributors to save as DRAFT and submit later — separate 'Save Draft' and 'Submit for
Review' actions.
4 Notify Managers via email/in-app notification on new submission.
Task 5.2: Publication Review & Approval
Managers review submitted books and either approve or reject them with feedback notes. Approved
books are published to the platform library and become available to members. Rejected books are
returned to the Contributor with review comments.
Implementation Hints
1 Add a review_notes field to Publication model for Manager feedback.
2 On approval: set status = PUBLISHED, create a corresponding Resource entry in the library catalog
automatically.
3 On rejection: set status = REJECTED, send notification to Contributor with review_notes.
4 Track review history: who reviewed, when, and what decision was made (audit log).
Task 5.3: Revenue & Royalty Management
Track revenue generated from published books (e.g., sales or access fees) and distribute royalties between
Contributors and platform administrators according to configurable sharing rules. Generate revenue
reports per publication and per contributor.
Implementation Hints
1 RevenueShare model: publication_id, contributor_share (%), platform_share (%), configured by
Manager.
2 Transaction model: transaction_id, publication_id, amount, buyer_id, date — records each sale or
access payment.
3 Calculate contributor earnings on demand or on a monthly schedule using a cron job.
4 Provide Contributors a personal earnings dashboard: total earned, per-book breakdown, payout history.
5 Generate PDF royalty statements for Contributors using a PDF generation library.
Task 5.4: Publication Catalog & Discovery
Expose published books in a publicly browsable catalog. Members can search by title, author, language,
or category. Each publication has a detail page with description, cover, contributor info, and availability
status.
Implementation Hints
1 Reuse the Resource catalog search infrastructure — published books are also Resources.
2 Add a 'featured' flag on publications — Managers can pin books to the homepage carousel.
3 Include contributor profile link on each publication detail page.
4 Filter by language (en, fr, rw) to support multilingual content discovery.
PHASE 6: E-LEARNING SERVICES
Task 6.1: Course Management
Contributors (educators) create and manage courses. Each course has a title, description, category, status
(draft/published), and is linked to a contributor. Managers review and approve courses before they
become available to members.
Implementation Hints
1 Course model: course_id, contributor_id (FK), title, description, category, language, cover_image,
status (DRAFT, PUBLISHED, ARCHIVED).
2 Add a prerequisite_course_id field for course sequencing (optional advanced feature).
3 Managers approve courses similar to the book publishing flow — reuse the review pattern.
4 Allow Contributors to archive courses — prevents new enrollments but retains data for enrolled
members.
Task 6.2: Lesson Management
Manage individual lessons within courses. Each lesson contains a title and content (text, embedded video
URL, or downloadable file). Lessons have an order index within their course. Contributors can add, edit,
reorder, and remove lessons.
Implementation Hints
1 Lesson model: lesson_id, course_id (FK), title, content, content_type (TEXT, VIDEO, FILE),
order_index, duration_minutes.
2 Use drag-and-drop on the frontend to reorder lessons — send a PATCH /lessons/reorder with new
order_index values in bulk.
3 Store video URLs (YouTube embed or Cloudinary-hosted) — do not store raw video files locally.
4 Mark lessons as preview-accessible (free) vs. enrollment-required to allow course previews.
Task 6.3: Course Enrollment
Enable members to browse available courses and enroll. The system records the enrollment with
enrolled_at date and initializes progress tracking. Members can also unenroll from courses they have not
completed.
Implementation Hints
1 Enrollment model: enrollment_id, user_id (FK), course_id (FK), enrolled_at, status (ACTIVE,
COMPLETED, DROPPED), progress (%).
2 Prevent duplicate enrollment — check for existing active enrollment before creating a new one.
3 Send a welcome email/notification upon enrollment with course start instructions.
4 List enrolled courses on the member dashboard with progress percentage and last accessed date.
Task 6.4: Quiz & Assessment Management
Contributors create quizzes linked to lessons or courses. Each quiz has questions with multiple-choice or
open-ended answers and a total marks value. Members take quizzes and receive auto-graded results for
multiple-choice, or await instructor review for open-ended responses.
Implementation Hints
1 Quiz model: quiz_id, course_id, title, total_marks. Question model: question_id, quiz_id,
question_text, marks, type (MCQ, OPEN).
2 For MCQ: store answer options in a JSON array with a correct_answer flag. Auto-calculate score on
submission.
3 Result model: result_id, user_id, quiz_id, score, grade, submitted_at.
4 For open-ended: set status = PENDING_REVIEW and notify the Contributor to grade manually.
5 Enforce one submission attempt per member per quiz — or allow configurable attempts.
Task 6.5: Examination Management
Manage formal examinations for courses — distinct from quizzes by being time-limited and high-stakes.
Members start an exam, answer questions within a time window, and submit. Marks are recorded and
feedback is returned. Exams contribute to certification eligibility.
Implementation Hints
1 Exam model: exam_id, course_id (FK), title, total_marks, duration_minutes, start_window,
end_window.
2 Record ExamSubmission: submission_id, exam_id, user_id, answers (JSON), submitted_at, score,
marks_saved.
3 Enforce timer on the frontend and auto-submit when time expires — use a server-side expiry check
too.
4 Store exam questions separately so they can be randomized per attempt.
Task 6.6: Progress Tracking
Track each member's learning progress through lessons, quizzes, and exams. Update progress percentage
automatically as lessons are completed. Display progress reports to members and allow Managers to view
learner analytics.
Implementation Hints
1 Update Enrollment.progress when a member marks a lesson as completed — calculate as
(completed_lessons / total_lessons) * 100.
2 Create a LessonCompletion model: user_id, lesson_id, completed_at for granular tracking.
3 Expose a GET /enrollments/:id/progress endpoint returning completed lessons, quiz scores, and exam
results.
4 Manager analytics: average completion rate per course, top performers, dropoff points.
Task 6.7: Certificate Generation
Automatically generate and issue completion certificates when a member finishes all lessons and passes
all required assessments for a course. Certificates include the member name, course title, completion date,
and a unique verification code.
Implementation Hints
1 Certificate model: certificate_id, user_id, course_id, issued_at, verification_code (UUID).
2 Generate PDF certificates using a library like PDFKit or Puppeteer with a branded template.
3 Add a public verification URL: GET /certificates/verify/:code — accessible without login for external
verification.
4 Trigger certificate generation in a background job after the final exam is graded to avoid slow API
responses.
PHASE 7: RESEARCH SUPPORT
Task 7.1: Research Project Management
Allow Contributors (researchers) to create and manage research projects on the platform. Each project has
a title, description, type, start and end dates, and a status. Managers can monitor all active research
projects.
Implementation Hints
1 ResearchProject model: project_id, contributor_id (FK), title, description, type, start_date, end_date,
status (ACTIVE, COMPLETED, SUSPENDED).
2 Support collaborators: allow multiple contributors on one project via a project_members join table.
3 Managers can view all projects filtered by status, contributor, or date range.
4 Allow contributors to close/archive completed projects while retaining their papers.
Task 7.2: Research Paper Submission & Repository
Provide a repository where researchers submit papers linked to their projects. Papers include title,
abstract, keywords, file upload, and publication date. Approved papers become discoverable in the
research repository for all platform members.
Implementation Hints
1 ResearchPaper model: paper_id, project_id (FK), contributor_id (FK), title, abstract, keywords (JSON
array), file_url, publication_date, status (DRAFT, SUBMITTED, PUBLISHED).
2 Upload PDFs to Cloudinary/S3. Validate file type and enforce size limits (e.g., 50MB max).
3 Managers approve papers before they appear in the public repository — same review pattern as books.
4 Index papers by keyword and abstract for full-text search in the repository.
Task 7.3: Resource Discovery for Research
Provide researchers with a specialized search experience to find library resources, research papers, and
external references relevant to their projects. Supports filtering by resource type, date range, language,
and subject area.
Implementation Hints
1 Build a unified search endpoint that queries Resources, Publications, and ResearchPapers in one
request.
2 Support advanced filters: type, language, date range, author — return faceted counts for each filter.
3 Implement AI-powered suggestions (see AI Assistance phase) to surface related resources based on
search query.
4 Allow researchers to save search results to a personal reading list or project resource list.
PHASE 8: AI ASSISTANCE
Task 8.1: AI-Powered Intelligent Search
Integrate AI assistance to enhance the platform search experience. Instead of plain keyword matching, the
AI interprets natural language queries and returns semantically relevant resources, papers, and courses.
Members can type questions like 'books about climate change for beginners' and get relevant results.
Implementation Hints
1 Integrate an LLM API (e.g., OpenAI or Anthropic Claude) to parse and expand user queries into
structured search terms.
2 Use vector embeddings (e.g., pgvector on PostgreSQL or Pinecone) for semantic similarity search on
resource descriptions.
3 Log AI search queries and results for refinement and analytics — never log personal user data.
4 Provide a fallback to standard keyword search if the AI service is unavailable (graceful degradation).
Task 8.2: Personalized Recommendations
Generate personalized resource and course recommendations for each member based on their borrowing
history, enrolled courses, search activity, and stated interests. Recommendations appear on the member
dashboard and inside library and course browsing pages.
Implementation Hints
1 Build a simple collaborative filtering model or use an LLM prompt with user activity context as a
starting point.
2 Track user interaction events: viewed, borrowed, enrolled, searched — store in an interactions table.
3 Expose GET /recommendations?type=resources and GET /recommendations?type=courses endpoints.
4 Refresh recommendations on a schedule (daily cron) rather than real-time to avoid performance hits.
5 Allow members to dismiss recommendations and mark interests in profile settings to improve
relevance.
Task 8.3: AI Chatbot & Automated Support
Provide an AI chatbot assistant embedded in the platform that answers member questions about library
resources, borrowing policies, course content, and platform navigation. The chatbot uses the platform's
knowledge base and can escalate to human support when needed.
Implementation Hints
1 Integrate an LLM with a system prompt describing the platform, rules, and available services.
2 Store conversation history per session: AIInteraction model: interaction_id, user_id, message,
response, created_at.
3 Add an escalation path: if the chatbot cannot answer, create a support ticket and notify Staff.
4 Rate-limit chatbot calls per user to prevent abuse (e.g., 20 messages per hour).
5 Never allow the AI to perform write operations — it should inform, not act on behalf of the user.
Task 8.4: Knowledge Discovery & Content Summarization
Allow members to request AI-generated summaries of research papers, book descriptions, and course
outlines. This helps members quickly assess whether a resource is relevant before borrowing or enrolling.
Summaries are generated on demand and optionally cached.
Implementation Hints
1 Create a POST /ai/summarize endpoint accepting resource_id and resource_type.
2 Call the LLM API with the resource's abstract, description, or extracted text as context.
3 Cache generated summaries in the database to avoid regenerating for the same resource.
4 Add a 'Summarize' button on resource detail pages and paper detail pages in the UI.
5 Include a disclaimer that AI summaries may not be fully accurate and should not replace reading the
source.
PHASE 9: MULTILINGUAL ACCESSIBILITY
Task 9.1: Internationalization (i18n) Infrastructure
Set up the platform internationalization framework to support English (en), French (fr), and Kinyarwanda
(rw). All static UI labels, error messages, notification templates, and system messages must be
translatable. Users select their preferred language in profile settings and the platform responds in that
language.
Implementation Hints
1 Use i18next (Node.js backend) and react-i18next (frontend) for translation key management.
2 Store translation files as JSON per language: locales/en.json, locales/fr.json, locales/rw.json.
3 Set the language from the user's profile preference and pass it as Accept-Language header or query
param.
4 Translate all error messages, email templates, and notification texts — not just UI labels.
Task 9.2: Multilingual Content Management
Allow Managers and Contributors to provide content (resource descriptions, course descriptions, category
names, announcements) in multiple languages. When a user's preferred language version does not exist,
fall back to English automatically.
Implementation Hints
1 Store multilingual fields as JSON: { en: '...', fr: '...', rw: '...' } directly in the model, or use a separate
Translations table for flexibility.
2 Create a helper function getLocalizedField(field, userLang, fallback='en') used throughout the API.
3 On the content editor UI, show tabs for each language so Contributors can fill all three versions.
4 Flag incomplete translations in the admin dashboard so Managers can track translation coverage.
Task 9.3: Language Preference & Switching
Allow users to view and change their preferred language at any time from the account settings or a quickswitch control in the navigation bar. The change must apply immediately without requiring a page reload
on the frontend.
Implementation Hints
1 Store language preference in the User model (language field: 'en' | 'fr' | 'rw').
2 On language switch, update both the user profile (API call) and the local i18n state simultaneously.
3 Persist language preference in localStorage as well so it loads immediately on next visit before auth.
4 Default new members to English — allow override during registration.
PHASE 10. Notification System
Admin dashboard should have:
Notification Module
• Email notifications
• In-app notifications
• Push notifications
• SMS notifications (optional)
Events:
• Borrow approved
• Book due soon
• Reservation available
• Course enrolled
• Publication approved
• Appointment reminder
PHASE 11. Payment System
Payment & Transactions Module
• Mobile Money
• Cards
• Bank transfer
Phase 10: Beauty & Wellness Services
Phase 11: Consultation & Counseling
Phase 12: Rehabilitation Services
Phase 13: Health System
System Architecture
Backend & Frontend Next.js, TypeScript , Tailwind CSS
Database PostgreSQL
Storage Free Cloudinary
AI chatbase
Authentication JWT
Deployment Vercel
Non-Functional Requirements
Performance 500+ concurrent users
Security JWT , OAuth , 2FA
Availability 99.9% uptime
Scalability Horizontal scaling
API Documentation REST API Example
POST /auth/login
POST /auth/signup
GET /resources
POST /resources
GET /courses
POST /borrow
POST /reserve
Master Conclusion
The Kingdom Library KCS Intelligent Platform is a comprehensive digital ecosystem designed to
centralize knowledge management, learning, research, publishing, wellness, counseling, rehabilitation,
and community services within a single intelligent platform.
The system leverages modern technologies, artificial intelligence, role-based access control, analytics,
and automation to improve service delivery, operational efficiency, and user experience. It provides
integrated solutions for administrators, librarians, researchers, publishers, instructors, service providers,
and community members.
With its scalable, secure, and future-ready architecture, the platform establishes a strong foundation for
digital transformation, knowledge sharing, innovation, and sustainable growth.
The successful implementation of this project will create a modern Kingdom Knowledge System that
connects people, resources, services, and opportunities while supporting continuous learning,
collaboration, wellness, and community development.