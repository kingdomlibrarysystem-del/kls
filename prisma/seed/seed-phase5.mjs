/**
 * One-off Phase 5 seed script: populates the real Course, Lesson,
 * Enrollment, Assessment, AssessmentAttempt, Certificate, and
 * SessionRequest collections from this app's current mock data.
 *
 * Consolidates THREE previously-unreconciled course catalogs (admin
 * course-catalog-data.ts, member course-catalog-data.ts, and the orphaned
 * course-preview-data.ts) into one real Course collection, keyed by the
 * member catalog's 12 courses (the richer, actually-enrolled-in catalog)
 * merged with the admin catalog's authoring fields (status/category/
 * author) where titles match by content overlap; admin-only courses
 * (crs-002/003/004/006, which have no member-catalog counterpart) are
 * seeded as their own additional Course rows.
 *
 * Placeholder Users are created for: the 3 lecturer personas
 * (lecturerRoster) and every distinct member name referenced across
 * enrollments/certificates/session-requests (the real User collection
 * had no rows for any of these — same situation as every prior phase's
 * seed). The single mocked "current member" (John Doe, id "5" in
 * auth-context.tsx's mockUsers) is also seeded as a real placeholder
 * User with a matching email, so this phase's real Enrollment/
 * AssessmentAttempt rows have a genuine userId to reference even though
 * live enrollment writes remain blocked pending real auth (see
 * PROGRESS.md's Phase 5 entry).
 *
 * Run via `npx tsx prisma/seed/seed-phase5.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const lecturerRoster = [
  { id: 'lec-1', name: 'Dr. Elias Nkubito' },
  { id: 'lec-2', name: 'Prof. Grace Nkomo' },
  { id: 'lec-3', name: 'Dr. James Kariuki' },
]

// Member catalog (the richer, actually-browsed/enrolled-in catalog) — id '1'..'12'.
const memberCourses = [
  { id: '1', title: 'Kingdom Foundations', lecturerId: 'lec-1', category: 'Theology', duration: '3h', rating: '4.8', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '2', title: 'Understanding Divine Purpose', lecturerId: 'lec-2', category: 'Personal Development', duration: '4h', rating: '4.6', image: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '3', title: 'Leadership & Governance', lecturerId: 'lec-3', category: 'Leadership', duration: '5h', rating: '4.7', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '4', title: 'The Art of Worship', lecturerId: 'lec-1', category: 'Worship', duration: '3h', rating: '4.9', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '5', title: 'Kingdom Marriage Principles', lecturerId: 'lec-2', category: 'Marriage', duration: '4h', rating: '4.5', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '6', title: 'Financial Stewardship', lecturerId: 'lec-3', category: 'Business', duration: '3h', rating: '4.4', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '7', title: 'Prayer & Meditation', lecturerId: 'lec-1', category: 'Theology', duration: '2h', rating: '4.8', image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '8', title: 'The Nature of God', lecturerId: 'lec-2', category: 'Theology', duration: '5h', rating: '4.9', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '9', title: 'Spiritual Authority', lecturerId: 'lec-3', category: 'Leadership', duration: '4h', rating: '4.6', image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '10', title: 'Building Healthy Relationships', lecturerId: 'lec-1', category: 'Personal Development', duration: '3h', rating: '4.5', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '11', title: 'The Kingdom Economy', lecturerId: 'lec-2', category: 'Business', duration: '6h', rating: '4.7', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '12', title: 'Divine Health & Wellness', lecturerId: 'lec-3', category: 'Health', duration: '4h', rating: '4.8', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
]

// Admin-only courses with no member-catalog counterpart (crs-002/003/004/006).
const adminOnlyCourses = [
  { title: 'Digital Discipleship', description: 'Using digital tools to mentor and disciple believers remotely.', category: 'Discipleship', status: 'PUBLISHED', author: 'Kingdom Library System', lecturerId: 'lec-2' },
  { title: 'Family & Marriage 101', description: 'Biblical foundations for building healthy marriages and family life.', category: 'Family & Marriage', status: 'PUBLISHED', author: 'Kingdom Library System' },
  { title: 'Leadership for Youth Pastors', description: 'Practical leadership training tailored to youth ministry contexts.', category: 'Youth Ministry', status: 'PUBLISHED', author: 'Kingdom Library System' },
  { title: 'Missions & Outreach', description: 'Principles and practice of cross-cultural missions and local outreach.', category: 'Missions', status: 'PUBLISHED', author: 'Kingdom Library System' },
]

// 12 courses × 4 lessons each (durations/content abbreviated from the real mock for brevity — same structure).
const lessonContentTypes = ['TEXT', 'VIDEO', 'FILE', 'TEXT']

const enrollments = [
  { memberEmail: 'john.doe@members.example.com', memberName: 'John Doe', courseId: '1', status: 'ENROLLED', enrolledAt: '2026-06-01', completedLessonIds: ['l-1', 'l-2'], assessmentPassed: false },
  { memberEmail: 'john.doe@members.example.com', memberName: 'John Doe', courseId: '2', status: 'ENROLLED', enrolledAt: '2026-06-05', completedLessonIds: ['l-1'], assessmentPassed: false },
  { memberEmail: 'john.doe@members.example.com', memberName: 'John Doe', courseId: '3', status: 'ENROLLED', enrolledAt: '2026-06-10', completedLessonIds: ['l-1'], assessmentPassed: false },
  { memberEmail: 'john.doe@members.example.com', memberName: 'John Doe', courseId: '4', status: 'COMPLETED', enrolledAt: '2026-05-20', completedLessonIds: ['l-1', 'l-2', 'l-3', 'l-4'], assessmentPassed: false },
  { memberEmail: 'jeanpaul@example.com', memberName: 'Jean Paul Nkurunziza', courseId: '1', status: 'COMPLETED', enrolledAt: '2026-04-02', completedLessonIds: ['l-1', 'l-2', 'l-3', 'l-4'], assessmentPassed: true },
  { memberEmail: 'amina@example.com', memberName: 'Amina Uwimana', courseId: '2', status: 'ENROLLED', enrolledAt: '2026-05-11', completedLessonIds: ['l-1', 'l-2'], assessmentPassed: false },
  { memberEmail: 'eric@example.com', memberName: 'Eric Habimana', courseId: '5', status: 'ENROLLED', enrolledAt: '2026-05-20', completedLessonIds: ['l-1'], assessmentPassed: false },
  { memberEmail: 'grace@example.com', memberName: 'Grace Mukamana', courseId: '9', status: 'DROPPED', enrolledAt: '2026-03-15', completedLessonIds: [], assessmentPassed: false },
  { memberEmail: 'davidn@example.com', memberName: 'David Ndayisenga', courseId: '1', status: 'ENROLLED', enrolledAt: '2026-06-01', completedLessonIds: ['l-1'], assessmentPassed: false },
  { memberEmail: 'sarah@example.com', memberName: 'Sarah Uwase', courseId: '6', status: 'COMPLETED', enrolledAt: '2026-02-20', completedLessonIds: ['l-1', 'l-2', 'l-3', 'l-4'], assessmentPassed: false },
]

const assessments = [
  { title: 'Kingdom Foundations — Quiz 1', kind: 'QUIZ', courseId: '1', questions: [
    { id: 'q1', text: 'What does the Foundation pillar establish?', type: 'SINGLE_SELECT', options: ['The end of all things', 'The origin of all things', 'Church expansion', 'Prophetic warnings'], correctOptionIndex: 1, marks: 10 },
    { id: 'q2', text: 'Which section is described as the "Voice of the Kingdom"?', type: 'SINGLE_SELECT', options: ['Wisdom', 'Prophetic', 'Acts', 'Epistles'], correctOptionIndex: 1, marks: 10 },
  ] },
  { title: 'Kingdom Foundations — Midterm', kind: 'EXAM', courseId: '1', durationSeconds: 90, questions: [
    { id: 'q1', text: 'Which book range does the Foundation pillar cover?', type: 'SINGLE_SELECT', options: ['Genesis – Deuteronomy', 'Joshua – Esther', 'Job – Song of Songs', 'Matthew – John'], correctOptionIndex: 0, marks: 10 },
    { id: 'q2', text: 'What is the theme of the History pillar?', type: 'SINGLE_SELECT', options: ['Warnings and Hope', 'Leadership and Restoration', 'Life of Christ', 'Kingdom Living'], correctOptionIndex: 1, marks: 10 },
    { id: 'q3', text: 'Which of these pillars are covered by the Foundation-to-History exam scope?', type: 'MULTI_SELECT', context: 'The midterm spans the first two KCS pillars only — select every pillar this exam actually covers, not the full eight-pillar system.', options: ['Foundation', 'History', 'Wisdom', 'Prophetic'], correctOptionIndices: [0, 1], marks: 10 },
    { id: 'q4', text: 'In one paragraph, describe how covenant shapes Kingdom identity.', type: 'OPEN', context: 'Scenario: a new member asks why the Kingdom Classification System begins with Genesis rather than the Gospels. Use covenant to explain the ordering choice.', marks: 20 },
  ] },
  { title: 'Understanding Divine Purpose — Quiz 1', kind: 'QUIZ', courseId: '2', questions: [
    { id: 'q1', text: 'What is the difference between purpose and calling?', type: 'SINGLE_SELECT', options: ['There is no difference', 'Purpose is why, calling is what', 'Calling is why, purpose is what', 'Both are the same as talent'], correctOptionIndex: 1, marks: 10 },
    { id: 'q2', text: 'Purpose is best discovered through:', type: 'SINGLE_SELECT', options: ['Isolation', 'Reflection and community', 'Comparison to others', 'Chance'], correctOptionIndex: 1, marks: 10 },
  ] },
  { title: 'The Art of Worship — Quiz 1', kind: 'QUIZ', courseId: '4', questions: [
    { id: 'q1', text: 'Worship is best described as:', type: 'SINGLE_SELECT', options: ['A single weekly act', 'A continuous lifestyle', 'Only musical expression', 'A private emotion only'], correctOptionIndex: 1, marks: 10 },
    { id: 'q2', text: 'Corporate worship primarily builds:', type: 'SINGLE_SELECT', options: ['Individual talent', 'Shared identity and community', 'Musical skill only', 'Competition'], correctOptionIndex: 1, marks: 10 },
  ] },
  { title: 'Leadership & Governance — Capstone Project', kind: 'PROJECT', courseId: '3', questions: [], brief: 'Design a governance structure for a 50-person ministry team: define at least three leadership roles, a decision-making process, and one conflict-resolution mechanism. Submit a link to your document or a written summary.', submissionFormat: 'LINK', projectMarks: 100 },
]

const certificates = [
  { memberEmail: 'jeanpaul@example.com', memberName: 'Jean Paul Nkurunziza', courseTitle: 'Foundations of Faith', issuedAt: '2026-05-02', verificationCode: 'KLS-7F3A-91BC' },
  { memberEmail: 'sarah@example.com', memberName: 'Sarah Uwase', courseTitle: 'Missions & Outreach', issuedAt: '2026-04-18', verificationCode: 'KLS-2D9E-44A1' },
  { memberEmail: 'davidn@example.com', memberName: 'David Ndayisenga', courseTitle: 'Foundations of Faith', issuedAt: '2026-06-10', verificationCode: 'KLS-88C1-0F2D' },
]

const sessionRequests = [
  { learnerEmail: 'john.doe@members.example.com', learnerName: 'John Doe', lecturerId: 'lec-1', courseId: '4', requestedAt: '2026-07-02', proposedTime: '2026-07-18T17:00', status: 'APPROVED', mode: 'SCHEDULED', scheduledAt: '2026-07-18T17:00', notes: 'Would love to go deeper on corporate worship postures covered in lesson 3.' },
  { learnerEmail: 'amina@example.com', learnerName: 'Amina Uwimana', lecturerId: 'lec-1', courseId: '1', requestedAt: '2026-07-08', proposedTime: '2026-07-22T16:30', status: 'PENDING', mode: 'SCHEDULED', notes: 'Question about the covenant framework in lesson 2 before I attempt the assessment.' },
  { learnerEmail: 'patrick@example.com', learnerName: 'Patrick Iradukunda', lecturerId: 'lec-2', courseId: '8', requestedAt: '2026-06-25', proposedTime: '2026-07-05T18:00', status: 'COMPLETED', mode: 'SCHEDULED', scheduledAt: '2026-07-05T18:00', notes: 'Session held — discussed the doctrine of divine attributes in more depth.' },
]

async function main() {
  console.log('Clearing existing E-Learning collections...')
  await prisma.sessionRequest.deleteMany({})
  await prisma.certificate.deleteMany({})
  await prisma.assessmentAttempt.deleteMany({})
  await prisma.assessment.deleteMany({})
  await prisma.enrollment.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.course.deleteMany({})

  console.log(`Seeding ${lecturerRoster.length} placeholder lecturer Users...`)
  const lecturerEmails = new Map(lecturerRoster.map((l) => [l.id, `${l.name.toLowerCase().replace(/[^a-z]+/g, '.')}@lecturers.example.com`]))
  const lecturerIdToUserId = new Map()
  for (const l of lecturerRoster) {
    const [firstName, ...rest] = l.name.trim().split(/\s+/)
    const email = lecturerEmails.get(l.id)
    // Upsert by email rather than delete-then-create: some of these
    // people (e.g. lecturers who are also seeded as generic Users
    // elsewhere) or, more commonly for the member list below, the exact
    // same person may already exist as a real User from an earlier
    // phase's seed (Phase 3/4 seeded Users from mock memberName/
    // memberEmail too) with real Borrow/Reservation/Publication rows
    // pointing at them — deleting and recreating would either violate
    // those relations or silently orphan them. Reuse the existing id.
    const created = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: l.name, firstName, lastName: rest.join(' '), email },
    })
    lecturerIdToUserId.set(l.id, created.id)
  }

  const memberEmails = [...new Set([...enrollments, ...certificates].map((r) => r.memberEmail))]
  console.log(`Seeding ${memberEmails.length} placeholder member Users (upsert by email — reusing any User already seeded by an earlier phase)...`)
  const emailToUserId = new Map()
  for (const email of memberEmails) {
    const source = [...enrollments, ...certificates].find((r) => r.memberEmail === email)
    const [firstName, ...rest] = source.memberName.trim().split(/\s+/)
    const created = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: source.memberName, firstName, lastName: rest.join(' '), email },
    })
    emailToUserId.set(email, created.id)
  }

  console.log(`Seeding ${memberCourses.length} courses from the member catalog...`)
  const memberIdToCourseId = new Map()
  for (const c of memberCourses) {
    const created = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        category: c.category,
        language: 'EN',
        status: 'PUBLISHED',
        author: 'Kingdom Library System',
        lecturerId: lecturerIdToUserId.get(c.lecturerId),
        image: c.image,
        duration: c.duration,
        rating: c.rating,
      },
    })
    memberIdToCourseId.set(c.id, created.id)
  }

  console.log(`Seeding ${adminOnlyCourses.length} admin-only courses...`)
  for (const c of adminOnlyCourses) {
    await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        category: c.category,
        language: 'EN',
        status: c.status,
        author: c.author,
        lecturerId: c.lecturerId ? lecturerIdToUserId.get(c.lecturerId) : null,
      },
    })
  }

  console.log(`Seeding 4 lessons per member course (${memberCourses.length * 4} total)...`)
  const courseLessonIds = new Map()
  for (const c of memberCourses) {
    const courseId = memberIdToCourseId.get(c.id)
    const ids = []
    for (let i = 0; i < 4; i++) {
      const lesson = await prisma.lesson.create({
        data: {
          courseId,
          title: `${c.title} — Lesson ${i + 1}`,
          contentType: lessonContentTypes[i],
          durationMinutes: 15 + i * 5,
          content: `Lesson ${i + 1} content for ${c.title}.`,
          order: i + 1,
        },
      })
      ids.push(lesson.id)
    }
    courseLessonIds.set(c.id, ids)
  }

  console.log(`Seeding ${enrollments.length} enrollments...`)
  for (const e of enrollments) {
    const courseId = memberIdToCourseId.get(e.courseId)
    const lessonIds = courseLessonIds.get(e.courseId) ?? []
    // Map mock 'l-N' completedLessonIds onto this course's real lesson ObjectIds by position.
    const completedLessonIds = e.completedLessonIds.map((mockId) => {
      const idx = parseInt(mockId.replace('l-', ''), 10) - 1
      return lessonIds[idx]
    }).filter(Boolean)
    await prisma.enrollment.create({
      data: {
        userId: emailToUserId.get(e.memberEmail),
        courseId,
        status: e.status,
        enrolledAt: new Date(e.enrolledAt),
        completedLessonIds,
        totalLessons: lessonIds.length,
        assessmentPassed: e.assessmentPassed,
      },
    })
  }

  console.log(`Seeding ${assessments.length} assessments...`)
  const assessmentTitleToId = new Map()
  for (const a of assessments) {
    const created = await prisma.assessment.create({
      data: {
        title: a.title,
        kind: a.kind,
        courseId: memberIdToCourseId.get(a.courseId),
        durationSeconds: a.durationSeconds ?? null,
        questions: a.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          context: q.context ?? null,
          options: q.options ?? [],
          correctOptionIndex: q.correctOptionIndex ?? null,
          correctOptionIndices: q.correctOptionIndices ?? [],
          marks: q.marks,
        })),
        brief: a.brief ?? null,
        submissionFormat: a.submissionFormat ?? null,
        projectMarks: a.projectMarks ?? null,
      },
    })
    assessmentTitleToId.set(a.title, created.id)
  }

  console.log('Seeding 3 assessment attempts for the John Doe placeholder user...')
  const johnDoeId = emailToUserId.get('john.doe@members.example.com')
  await prisma.assessmentAttempt.create({
    data: { userId: johnDoeId, assessmentId: assessmentTitleToId.get('Kingdom Foundations — Quiz 1'), status: 'PASSED', reviewStatus: 'AUTO_GRADED', score: 17, totalMarks: 20, takenAt: new Date('2026-06-20') },
  })
  await prisma.assessmentAttempt.create({
    data: { userId: johnDoeId, assessmentId: assessmentTitleToId.get('Understanding Divine Purpose — Quiz 1'), status: 'PASSED', reviewStatus: 'AUTO_GRADED', score: 14, totalMarks: 20, takenAt: new Date('2026-06-15') },
  })
  await prisma.assessmentAttempt.create({
    data: {
      userId: johnDoeId,
      assessmentId: assessmentTitleToId.get('Kingdom Foundations — Midterm'),
      status: 'FAILED',
      reviewStatus: 'PENDING_REVIEW',
      score: 30,
      totalMarks: 50,
      takenAt: new Date('2026-06-28'),
      openAnswers: { q4: 'Covenant establishes the relational and legal basis for Kingdom identity, which is why the Kingdom Classification System begins with Genesis — the origin of that covenant — rather than the Gospels, which describe its fulfillment.' },
    },
  })

  console.log(`Seeding ${certificates.length} certificates...`)
  for (const c of certificates) {
    await prisma.certificate.create({
      data: {
        userId: emailToUserId.get(c.memberEmail),
        memberName: c.memberName,
        courseTitle: c.courseTitle,
        issuedAt: new Date(c.issuedAt),
        verificationCode: c.verificationCode,
      },
    })
  }

  console.log(`Seeding ${sessionRequests.length} session requests...`)
  for (const s of sessionRequests) {
    let learnerUserId = emailToUserId.get(s.learnerEmail)
    if (!learnerUserId) {
      const [firstName, ...rest] = s.learnerName.trim().split(/\s+/)
      const created = await prisma.user.upsert({
        where: { email: s.learnerEmail },
        update: {},
        create: { name: s.learnerName, firstName, lastName: rest.join(' '), email: s.learnerEmail },
      })
      learnerUserId = created.id
      emailToUserId.set(s.learnerEmail, learnerUserId)
    }
    await prisma.sessionRequest.create({
      data: {
        learnerId: learnerUserId,
        learnerName: s.learnerName,
        lecturerId: lecturerIdToUserId.get(s.lecturerId),
        lecturerName: lecturerRoster.find((l) => l.id === s.lecturerId).name,
        courseId: memberIdToCourseId.get(s.courseId),
        courseTitle: memberCourses.find((c) => c.id === s.courseId).title,
        requestedAt: new Date(s.requestedAt),
        proposedTime: new Date(s.proposedTime),
        status: s.status,
        mode: s.mode,
        scheduledAt: s.scheduledAt ? new Date(s.scheduledAt) : null,
        notes: s.notes ?? null,
      },
    })
  }

  const counts = await Promise.all([
    prisma.user.count(), prisma.course.count(), prisma.lesson.count(),
    prisma.enrollment.count(), prisma.assessment.count(), prisma.assessmentAttempt.count(),
    prisma.certificate.count(), prisma.sessionRequest.count(),
  ])
  console.log(`Done. User: ${counts[0]}, Course: ${counts[1]}, Lesson: ${counts[2]}, Enrollment: ${counts[3]}, Assessment: ${counts[4]}, AssessmentAttempt: ${counts[5]}, Certificate: ${counts[6]}, SessionRequest: ${counts[7]}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
