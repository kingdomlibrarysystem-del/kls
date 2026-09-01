import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Cinzel, Cormorant_Garamond, Lato } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider, type Lang } from '@/contexts/language-context'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kingdom Library System',
  description: 'Digital library management, research, publishing, and e-learning platform',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

function resolveInitialLang(langValue: string | undefined): Lang {
  return langValue === 'en' || langValue === 'fr' || langValue === 'rw' ? langValue : 'en'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialLang = resolveInitialLang(cookieStore.get('kls_lang')?.value)
  return (
    <html lang={initialLang} suppressHydrationWarning className={`${cinzel.variable} ${cormorant.variable} ${lato.variable}`}>
      <body suppressHydrationWarning className="bg-white text-w-950 antialiased font-lato font-light">
        <ThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <LanguageProvider initialLang={initialLang}>
                {children}
                {process.env.NODE_ENV === 'production' && <Analytics />}
              </LanguageProvider>
            </AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
