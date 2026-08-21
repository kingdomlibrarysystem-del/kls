import Link from "next/link";
import Image from "next/image";
import { BookOpen, Mail, Phone, MapPin } from "lucide-react";

export function MainFooter() {
  return (
    <footer className="bg-w-950 text-w-200">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/kls-logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="font-cinzel text-lg font-bold text-white">
                Kingdom Library
              </span>
            </Link>
            <p className="font-lato text-sm text-w-400 leading-relaxed mb-6">
              A comprehensive digital library and e-learning platform for
              scholars, researchers, and lifelong learners.
            </p>
            <div className="flex flex-col gap-2 text-sm font-lato text-w-400">
              <a
                href="mailto:kingdomlibrarysystem@gmail.com"
                className="flex items-center gap-2 hover:text-w-100 transition"
              >
                <Mail size={14} /> kingdomlibrarysystem@gmail.com
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={14} /> Kigali, Rwanda
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2 font-lato text-sm">
              <li>
                <Link href="/library" className="hover:text-w-100 transition">
                  Browse Library
                </Link>
              </li>
              <li>
                <Link
                  href="/member/e-learning"
                  className="hover:text-w-100 transition"
                >
                  E-Learning
                </Link>
              </li>
              <li>
                <Link
                  href="/member/borrowings"
                  className="hover:text-w-100 transition"
                >
                  My Borrowings
                </Link>
              </li>
              <li>
                <Link
                  href="/member/courses"
                  className="hover:text-w-100 transition"
                >
                  My Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="flex flex-col gap-2 font-lato text-sm">
              <li>
                <Link href="/auth/login" className="hover:text-w-100 transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="hover:text-w-100 transition"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/member/reservations"
                  className="hover:text-w-100 transition"
                >
                  Reservations
                </Link>
              </li>
              <li>
                <Link
                  href="/member/certificates"
                  className="hover:text-w-100 transition"
                >
                  Certificates
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="flex flex-col gap-2 font-lato text-sm">
              <li>
                <Link href="/library" className="hover:text-w-100 transition">
                  Digital Collection
                </Link>
              </li>
              <li>
                <Link
                  href="/member/assessments"
                  className="hover:text-w-100 transition"
                >
                  Assessments
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-w-100 transition">
                  Research Papers
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-w-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-lato text-xs text-w-500">
            &copy; {new Date().getFullYear()} Kingdom Library System. All rights
            reserved.
          </p>
          <div className="flex gap-4 font-lato text-xs text-w-500">
            <Link href="#" className="hover:text-w-300 transition">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-w-300 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
