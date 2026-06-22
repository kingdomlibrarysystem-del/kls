import Link from 'next/link'

export function MainFooter() {
  return (
    <footer className="bg-white border-t border-w-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-4">
              Kingdom Library
            </h3>
            <p className="font-lato text-sm text-w-700">
              Your gateway to digital knowledge and learning.
            </p>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-w-950 mb-3">Library</h4>
            <ul className="space-y-2 font-lato text-sm text-w-700">
              <li><a href="#" className="hover:text-w-950">Browse Books</a></li>
              <li><a href="#" className="hover:text-w-950">Advanced Search</a></li>
              <li><a href="#" className="hover:text-w-950">Categories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-w-950 mb-3">Account</h4>
            <ul className="space-y-2 font-lato text-sm text-w-700">
              <li><Link href="/auth/login" className="hover:text-w-950">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-w-950">Create Account</Link></li>
              <li><a href="#" className="hover:text-w-950">Forgot Password</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-semibold text-w-950 mb-3">Help</h4>
            <ul className="space-y-2 font-lato text-sm text-w-700">
              <li><a href="#" className="hover:text-w-950">Support</a></li>
              <li><a href="#" className="hover:text-w-950">Contact Us</a></li>
              <li><a href="#" className="hover:text-w-950">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-w-200 pt-8 text-center">
          <p className="font-lato text-sm text-w-700">
            © {new Date().getFullYear()} Kingdom Library System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
