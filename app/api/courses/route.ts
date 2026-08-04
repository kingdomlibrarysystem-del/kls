import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Course API, consolidating the three previously-unreconciled mock
 * catalogs found in Phase 5's re-verification (admin course-catalog-
 * data.ts, member course-catalog-data.ts, and an orphaned public
 * course-preview-data.ts) into one collection. Response shape merges the
 * fields both admin and member UIs need (status/category/language/author
 * from admin, lessons-count/duration/rating/students-derived-from-
 * enrollments from member).
 */
function serializeCourse(c: {
  id: string
  title: string
  description: string
  category: string
  language: string
  status: string
  author: string
  lecturerId: string | null
  lecturer?: { name: string | null; firstName: string | null; lastName: string | null } | null
  image: string | null
  duration: string | null
  rating: string | null
  createdAt: Date
  _count?: { lessons: number; enrollments: number }
}) {
  const lecturerName = c.lecturer
    ? c.lecturer.name ?? `${c.lecturer.firstName ?? ''} ${c.lecturer.lastName ?? ''}`.trim()
    : undefined
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    language: c.language.toLowerCase(),
    status: c.status,
    author: c.author,
    lecturerId: c.lecturerId ?? undefined,
    instructor: lecturerName,
    image: c.image ?? undefined,
    duration: c.duration ?? undefined,
    rating: c.rating ?? undefined,
    lessons: c._count?.lessons ?? 0,
    students: c._count?.enrollments ?? 0,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }
}

const VALID_STATUSES = ['DRAFT', 'PUBLISHED']
const LECTURER_SELECT = { lecturer: { select: { name: true, firstName: true, lastName: true } }, _count: { select: { lessons: true, enrollments: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const lecturerId = searchParams.get('lecturerId')

  const where = {
    ...(lecturerId && { lecturerId }),
    ...(category && category !== 'All' && { category }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as 'DRAFT' | 'PUBLISHED' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { author: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: LECTURER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: courses.map(serializeCourse),
    message: 'Courses fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.description || !body.category) {
      return NextResponse.json({ data: null, message: 'Missing required fields: title, description, category', code: 'error', status: 400 }, { status: 400 })
    }

    if (body.lecturerId) {
      const lecturer = await prisma.user.findUnique({ where: { id: body.lecturerId } })
      if (!lecturer) {
        return NextResponse.json({ data: null, message: 'The specified lecturer does not exist', code: 'error', status: 400 }, { status: 400 })
      }
    }

    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        language: (body.language ?? 'en').toUpperCase(),
        status: body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        author: body.author ?? 'Kingdom Library System',
        lecturerId: body.lecturerId || null,
        image: body.image ?? null,
        duration: body.duration ?? null,
        rating: body.rating ?? null,
      },
      include: LECTURER_SELECT,
    })

    return NextResponse.json({ data: serializeCourse(course), message: 'Course created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create course', code: 'error', status: 500 }, { status: 500 })
  }
}
