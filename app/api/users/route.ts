import { NextRequest, NextResponse } from 'next/server'

const mockUsers = [
  { id: '1', firstName: 'Super', lastName: 'Admin', email: 'superadmin@kingdom.com', role: 'super_admin', status: 'active', emailVerified: true, createdAt: '2024-01-01' },
  { id: '2', firstName: 'Admin', lastName: 'User', email: 'admin@kingdom.com', role: 'admin', status: 'active', emailVerified: true, createdAt: '2024-01-05' },
  { id: '3', firstName: 'Library', lastName: 'Manager', email: 'manager@kingdom.com', role: 'manager', status: 'active', emailVerified: true, createdAt: '2024-01-10' },
  { id: '4', firstName: 'Library', lastName: 'Staff', email: 'staff@kingdom.com', role: 'staff', status: 'active', emailVerified: true, createdAt: '2024-01-15' },
  { id: '5', firstName: 'Library', lastName: 'Staff Two', email: 'staff2@kingdom.com', role: 'staff', status: 'active', emailVerified: true, createdAt: '2024-01-20' },
  { id: '6', firstName: 'Student', lastName: 'Member', email: 'member@kingdom.com', role: 'member', status: 'active', emailVerified: true, createdAt: '2024-01-25' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search   = searchParams.get('search')?.toLowerCase()
  const role     = searchParams.get('role')
  const status   = searchParams.get('status')

  let filtered = mockUsers

  if (role   && role   !== 'all') filtered = filtered.filter(u => u.role === role)
  if (status && status !== 'all') filtered = filtered.filter(u => u.status === status)
  if (search) filtered = filtered.filter(u =>
    u.firstName.toLowerCase().includes(search) ||
    u.lastName.toLowerCase().includes(search)  ||
    u.email.toLowerCase().includes(search)
  )

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const data = filtered.slice((page - 1) * pageSize, page * pageSize)

  return NextResponse.json({
    data,
    message: 'Users fetched successfully',
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

    if (!body.email || !body.firstName) {
      return NextResponse.json({ data: null, message: 'Missing required fields: email, firstName', code: 'error', status: 400 }, { status: 400 })
    }

    const newUser = {
      id: crypto.randomUUID(),
      firstName: body.firstName,
      lastName: body.lastName || '',
      email: body.email,
      role: body.role || 'member',
      status: 'active',
      emailVerified: false,
      createdAt: new Date().toISOString().split('T')[0],
    }

    return NextResponse.json({ data: newUser, message: 'User created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create user', code: 'error', status: 500 }, { status: 500 })
  }
}
