import { NextRequest, NextResponse } from 'next/server'

const mockBorrowings = [
  { id: '1', resourceTitle: 'Introduction to Web Development', borrowDate: '2024-01-15', dueDate: '2024-02-15', returnDate: null, status: 'active', daysLeft: 28 },
  { id: '2', resourceTitle: 'The Art of Programming', borrowDate: '2024-01-01', dueDate: '2024-02-01', returnDate: null, status: 'overdue', daysLeft: -14 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const status   = searchParams.get('status')

  let filtered = mockBorrowings

  if (status) filtered = filtered.filter(b => b.status === status.toLowerCase())

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const data = filtered.slice((page - 1) * pageSize, page * pageSize)

  return NextResponse.json({
    data,
    message: 'Borrowings fetched successfully',
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

    if (!body.resourceId || !body.userId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: resourceId, userId', code: 'error', status: 400 }, { status: 400 })
    }

    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    const newBorrow = {
      id: crypto.randomUUID(),
      resourceTitle: body.resourceTitle,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      returnDate: null,
      status: 'pending',
      daysLeft: 14,
    }

    return NextResponse.json({ data: newBorrow, message: 'Borrow request created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create borrow request', code: 'error', status: 500 }, { status: 500 })
  }
}
