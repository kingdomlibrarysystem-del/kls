import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()
  await prisma.resource.deleteMany()

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'superadmin@kingdom.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@kingdom.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@kingdom.com',
        firstName: 'Library',
        lastName: 'Manager',
        password: hashedPassword,
        role: UserRole.MANAGER,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@kingdom.com',
        firstName: 'Library',
        lastName: 'Staff',
        password: hashedPassword,
        role: UserRole.STAFF,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'contributor@kingdom.com',
        firstName: 'Author',
        lastName: 'Contributor',
        password: hashedPassword,
        role: UserRole.CONTRIBUTOR,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'member@kingdom.com',
        firstName: 'Student',
        lastName: 'Member',
        password: hashedPassword,
        role: UserRole.MEMBER,
        emailVerified: true,
      },
    }),
  ])

  console.log(`Created ${users.length} users`)

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: { en: 'Science', fr: 'Sciences', rw: 'Ibikunzo' },
        slug: 'science',
      },
    }),
    prisma.category.create({
      data: {
        name: { en: 'Technology', fr: 'Technologie', rw: 'Tekinoloji' },
        slug: 'technology',
      },
    }),
    prisma.category.create({
      data: {
        name: { en: 'History', fr: 'Histoire', rw: 'Amateka' },
        slug: 'history',
      },
    }),
    prisma.category.create({
      data: {
        name: { en: 'Literature', fr: 'Littérature', rw: 'Igitabo' },
        slug: 'literature',
      },
    }),
  ])

  console.log(`Created ${categories.length} categories`)

  // Create sample resources
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        title: 'Introduction to Web Development',
        description: 'A comprehensive guide to modern web development practices and tools',
        author: 'Jane Smith',
        publisher: 'Tech Press',
        isbn: '978-0-123456-78-9',
        publicationYear: 2023,
        type: 'BOOK',
        format: 'PHYSICAL',
        totalQuantity: 5,
        availableQuantity: 5,
        categoryId: categories[1].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'The Art of Programming',
        description: 'Master the fundamentals of computer science',
        author: 'John Doe',
        publisher: 'Code Publishers',
        isbn: '978-0-987654-32-1',
        publicationYear: 2022,
        type: 'BOOK',
        format: 'DIGITAL',
        totalQuantity: 10,
        availableQuantity: 10,
        categoryId: categories[1].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'World History Essentials',
        description: 'Key events and turning points in human history',
        author: 'Robert Johnson',
        publisher: 'History House',
        publicationYear: 2021,
        type: 'BOOK',
        format: 'PHYSICAL',
        totalQuantity: 8,
        availableQuantity: 8,
        categoryId: categories[2].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Biology in the 21st Century',
        description: 'Modern approaches to biological sciences',
        author: 'Dr. Sarah Wilson',
        publisher: 'Science Press',
        publicationYear: 2023,
        type: 'JOURNAL',
        format: 'DIGITAL',
        totalQuantity: 3,
        availableQuantity: 3,
        categoryId: categories[0].id,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'AI and Machine Learning Fundamentals',
        description: 'Learn AI and ML from scratch with practical examples',
        author: 'Tech Experts',
        publisher: 'Digital Academy',
        type: 'EBOOK',
        format: 'DIGITAL',
        totalQuantity: 15,
        availableQuantity: 15,
        categoryId: categories[1].id,
      },
    }),
  ])

  console.log(`Created ${resources.length} resources`)

  console.log('Seeding completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
