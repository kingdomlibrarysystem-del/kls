'use client'

import Link from 'next/link'
import { BookOpenText, LibraryBig, LogIn, Send, UserPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

/** Title, the three steps, and the switch between "submit" and "my books" for /publish and /member/publish. */
export function PublishHeader({ editing, myBooksHref, submitHref, view }: { editing?: boolean; myBooksHref: string; submitHref: string; view: 'submit' | 'books' }) {
  const { t } = useLanguage()
  const steps = [
    { Icon: BookOpenText, text: t('publish.step_1') },
    { Icon: Send, text: t('publish.step_2') },
    { Icon: LibraryBig, text: t('publish.step_3') },
  ]
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-foreground sm:text-3xl">
            {view === 'books' ? t('publish.my_books') : editing ? t('publish.edit_title') : t('publish.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {view === 'books' ? t('publish.my_books_sub') : editing ? t('publish.edit_subtitle') : t('publish.subtitle')}
          </p>
        </div>
      </div>
      {view === 'submit' && !editing && (
        <ol className="grid gap-2 sm:grid-cols-3">
          {steps.map(({ Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
              <span className="text-sm text-foreground"><span className="font-semibold">{i + 1}.</span> {text}</span>
            </li>
          ))}
        </ol>
      )}
    </header>
  )
}

/** Shown on /publish to signed-out visitors: anyone with an account can submit. */
export function PublishSignIn({ redirect }: { redirect: string }) {
  const { t } = useLanguage()
  const q = `?redirect=${encodeURIComponent(redirect)}`
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-xs">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><LogIn className="size-6" aria-hidden /></span>
      <h2 className="font-cinzel text-xl font-bold text-foreground">{t('publish.sign_in_title')}</h2>
      <p className="text-sm text-muted-foreground">{t('publish.sign_in_text')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={`/auth/login${q}`} className={buttonVariants({ size: 'lg' })}><LogIn /> {t('publish.sign_in')}</Link>
        <Link href={`/auth/register${q}`} className={buttonVariants({ variant: 'outline', size: 'lg' })}><UserPlus /> {t('publish.create_account')}</Link>
      </div>
    </div>
  )
}
