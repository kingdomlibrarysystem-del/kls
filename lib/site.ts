/**
 * The public address Google and link previews use. www.libkingdom.com is the
 * main address (libkingdom.com redirects to it). NEXT_PUBLIC_SITE_URL can
 * override it (e.g. a staging domain) — not NEXTAUTH_URL / NEXT_PUBLIC_BASE_URL,
 * which point at localhost in development.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.libkingdom.com').replace(/\/+$/, '')

export const SITE_NAME = 'Kingdom Library'

export const SITE_DESCRIPTION =
  'Kingdom Library — read books in the digital library, learn with free online courses and certificates, read our newsletter, and get help from our services: health, beauty, counseling and rehabilitation.'

/**
 * The main public pages, in the order we want Google to show them under the
 * site name (sitelinks). Used by the sitemap and the home page's structured data.
 */
export const MAIN_PAGES = [
  { name: 'Library', path: '/library', description: 'Browse books, journals and digital resources.' },
  { name: 'E-Learning', path: '/e-learning', description: 'Online courses with lessons, quizzes and certificates.' },
  { name: 'Services', path: '/services', description: 'Health, beauty, counseling and rehabilitation services.' },
  { name: 'Newsletter', path: '/news', description: 'Newsletters, articles and newspaper editions.' },
  { name: 'Sign up', path: '/auth/register', description: 'Create your free Kingdom Library account.' },
  { name: 'Log in', path: '/auth/login', description: 'Sign in to your Kingdom Library account.' },
] as const
