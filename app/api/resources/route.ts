import { NextRequest, NextResponse } from 'next/server'

const mockResources = [
  { id: '1', title: 'Introduction to Web Development', description: 'A comprehensive guide to modern web development practices', author: 'Jane Smith', type: 'book', format: 'physical', status: 'available', totalQuantity: 5, availableQuantity: 5, category: 'Technology' },
  { id: '2', title: 'The Art of Programming', description: 'Master the fundamentals of computer science', author: 'John Doe', type: 'ebook', format: 'digital', status: 'available', totalQuantity: 10, availableQuantity: 10, category: 'Technology' },
  { id: '3', title: 'World History Essentials', description: 'Key events and turning points in human history', author: 'Robert Johnson', type: 'book', format: 'physical', status: 'available', totalQuantity: 8, availableQuantity: 8, category: 'History' },
  { id: '4', title: 'Biology in the 21st Century', description: 'Modern approaches to biological sciences', author: 'Dr. Sarah Wilson', type: 'journal', format: 'digital', status: 'available', totalQuantity: 3, availableQuantity: 3, category: 'Science' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search   = searchParams.get('search')?.toLowerCase()
  const category = searchParams.get('category')
  const sortBy   = searchParams.get('sortBy') || 'title'
  const sortOrder = searchParams.get('sortOrder') || 'asc'

  let filtered = mockResources

  if (category) filtered = filtered.filter(r => r.category.toLowerCase() === category.toLowerCase())
  if (search)   filtered = filtered.filter(r => r.title.toLowerCase().includes(search) || r.author.toLowerCase().includes(search))

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const data = filtered.slice((page - 1) * pageSize, page * pageSize)

  return NextResponse.json({
    data,
    message: 'Resources fetched successfully',
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

    if (!body.title || !body.author || !body.type) {
      return NextResponse.json({ data: null, message: 'Missing required fields: title, author, type', code: 'error', status: 400 }, { status: 400 })
    }

    const newResource = { id: crypto.randomUUID(), ...body, status: 'available' }

    return NextResponse.json({ data: newResource, message: 'Resource created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create resource', code: 'error', status: 500 }, { status: 500 })
  }
}
