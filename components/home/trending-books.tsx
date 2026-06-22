import Image from 'next/image'
import Link from 'next/link'

const books = [
  {
    src: '/images/book-C.jpg',
    alt: 'New Release Book',
    badge: { line1: 'New', line2: 'Release', bg: 'bg-w-950', text1: 'text-w-accent', text2: 'text-w-300', border: 'border-w-accent' },
    shopHref: '/library',
    rentHref: '/library',
  },
  {
    src: '/images/book-B.jpg',
    alt: 'Pre Order Book',
    badge: { line1: 'Pre', line2: 'Order', bg: 'bg-w-800', text1: 'text-w-accent', text2: 'text-w-300', border: 'border-w-accent' },
    shopHref: '/reservations',
    rentHref: '/reservations',
  },
  {
    src: '/images/book-A.jpg',
    alt: 'Top Rated Book',
    badge: { line1: 'Top', line2: 'Rated', bg: 'bg-w-700', text1: 'text-white', text2: 'text-w-300', border: 'border-w-accent' },
    shopHref: '/library',
    rentHref: '/library',
  },
  {
    src: '/images/book-B.jpg',
    alt: 'Best Seller Book',
    badge: { line1: 'Best', line2: 'Seller', bg: 'bg-w-600', text1: 'text-white', text2: 'text-w-100', border: 'border-w-300' },
    shopHref: '/library',
    rentHref: '/library',
  },
]

export function TrendingBooks() {
  return (
    <div className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-lato text-xs font-semibold text-w-600 uppercase tracking-widest">
              Handpicked for You
            </span>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-w-950 mt-1">
              Trending Right Now
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.alt} className="relative group cursor-pointer">
              <div className={`absolute -top-3 -left-3 z-20 w-16 h-16 rounded-full ${book.badge.bg} border-2 ${book.badge.border} flex flex-col items-center justify-center shadow-md`}>
                <p className={`font-cinzel text-xs font-bold ${book.badge.text1} leading-none`}>{book.badge.line1}</p>
                <p className={`font-cinzel text-[10px] font-bold ${book.badge.text2} leading-none mt-0.5`}>{book.badge.line2}</p>
              </div>
              <div className="relative w-full h-64 md:h-72 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={book.src}
                  alt={book.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-w-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end gap-2 pb-4">
                  <Link
                    href={book.shopHref}
                    className="w-32 text-center py-2 bg-w-accent text-w-950 rounded font-lato font-bold text-sm hover:bg-w-300 transition"
                  >
                    Shop now
                  </Link>
                  <Link
                    href={book.rentHref}
                    className="w-32 text-center py-2 bg-w-950 text-w-accent border border-w-accent rounded font-lato font-bold text-sm hover:bg-w-800 transition"
                  >
                    Rent
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Link
            href="/library"
            className="font-lato font-semibold text-w-700 hover:text-w-950 border-b border-w-600 hover:border-w-950 transition pb-0.5"
          >
            Explore More Books
          </Link>
        </div>

      </div>
    </div>
  )
}
