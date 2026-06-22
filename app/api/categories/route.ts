import { NextRequest, NextResponse } from 'next/server'

const mockCategories = [
  { id: '1', name: { en: 'Technology', fr: 'Technologie', rw: 'Tekinoloji' }, slug: 'technology', resourceCount: 2 },
  { id: '2', name: { en: 'Science',    fr: 'Sciences',    rw: 'Ibikunzo'   }, slug: 'science',    resourceCount: 1 },
  { id: '3', name: { en: 'History',    fr: 'Histoire',    rw: 'Amateka'    }, slug: 'history',    resourceCount: 1 },
  { id: '4', name: { en: 'Literature', fr: 'Littérature', rw: 'Igitabo'    }, slug: 'literature', resourceCount: 0 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

  const totalItems = mockCategories.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const data = mockCategories.slice((page - 1) * pageSize, page * pageSize)

  return NextResponse.json({
    data,
    message: 'Categories fetched successfully',
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

    if (!body.name || !body.slug) {
      return NextResponse.json({ data: null, message: 'Missing required fields: name, slug', code: 'error', status: 400 }, { status: 400 })
    }

    const newCategory = { id: crypto.randomUUID(), ...body, resourceCount: 0 }

    return NextResponse.json({ data: newCategory, message: 'Category created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create category', code: 'error', status: 500 }, { status: 500 })
  }
}
