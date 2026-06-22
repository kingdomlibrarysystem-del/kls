import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { ElegantButton } from '@/components/ui/elegant-button'
import { LibraryBrowser } from './_components/library-browser'

const books = [
  {
    id: '1',
    title: 'The Pursuit of Knowledge',
    author: 'Dr. James Mitchell',
    category: 'Philosophy',
    format: 'E-Book',
    summary: 'A deep dive into philosophical inquiry, examining how humanity has chased understanding across centuries — from Socrates to modern thinkers.',
    isbn: '978-1234567890',
    pages: 312,
    language: 'English',
    year: 2021,
    price: 4500,
    cover: '/images/book-A.jpg',
  },
  {
    id: '2',
    title: 'Digital Transformation',
    author: 'Sarah Johnson',
    category: 'Technology',
    format: 'PDF Journal',
    summary: 'Explores how digital technologies are reshaping industries, governance, and daily life — with case studies from Africa and beyond.',
    isbn: '978-0987654321',
    pages: 256,
    language: 'English',
    year: 2022,
    price: 6000,
    cover: '/images/book-B.jpg',
  },
  {
    id: '3',
    title: 'Ancient Civilizations',
    author: 'Prof. Robert Anderson',
    category: 'History',
    format: 'E-Book',
    summary: 'A sweeping journey through the rise and fall of ancient empires — Egypt, Rome, Mesopotamia — and the lessons they leave for today.',
    isbn: '978-1122334455',
    pages: 480,
    language: 'English',
    year: 2019,
    price: 5500,
    cover: '/images/book-C.jpg',
  },
  {
    id: '4',
    title: 'Modern Art & Culture',
    author: 'Elena Rodriguez',
    category: 'Arts',
    format: 'Interactive PDF',
    summary: 'An illustrated survey of 20th and 21st century art movements, from Abstract Expressionism to digital art and street culture.',
    isbn: '978-5566778899',
    pages: 198,
    language: 'English',
    year: 2023,
    price: 3800,
    cover: '/images/book-A.jpg',
  },
  {
    id: '5',
    title: 'Introduction to Web Development',
    author: 'Jane Smith',
    category: 'Technology',
    format: 'E-Book',
    summary: 'A hands-on guide covering HTML, CSS, JavaScript and modern frameworks — ideal for beginners starting their coding journey.',
    isbn: '978-1111222233',
    pages: 340,
    language: 'English',
    year: 2022,
    price: 7000,
    cover: '/images/book-B.jpg',
  },
  {
    id: '6',
    title: 'World History Essentials',
    author: 'Robert Johnson',
    category: 'History',
    format: 'E-Book',
    summary: 'Concise yet thorough coverage of global history milestones — wars, revolutions, cultural shifts — written for students and general readers.',
    isbn: '978-4444555566',
    pages: 290,
    language: 'English',
    year: 2020,
    price: 4000,
    cover: '/images/book-C.jpg',
  },
]

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <PageHeader
          title="Browse the Library"
          subtitle="Discover books, journals, and digital resources"
          className="text-center"
        />
        <LibraryBrowser books={books} />
        <div className="mt-14 text-center border-t border-w-300 pt-10">
          <p className="font-lato text-w-700 mb-4">
            Want to borrow or reserve books? Create a free account.
          </p>
          <Link href="/auth/register">
            <ElegantButton variant="primary">Join Kingdom Library</ElegantButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
