'use client'

import { useMemo } from 'react'
import { sanitizeHtml } from '@/lib/html-sanitizer'

interface NewsletterContentProps {
  html: string
  className?: string
}

/**
 * Renders sanitized rich HTML content produced by the newsletter
 * editor (TipTap). Sanitizes on every render to guarantee no
 * unsanitized content ever reaches the DOM — works for both
 * the dashboard detail view and the public-facing article view.
 */
export function NewsletterContent({ html, className }: NewsletterContentProps) {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html])

  return (
    <div
      className={`newsletter-content font-lato text-sm text-w-950 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_blockquote]:border-l-3 [&_blockquote]:border-w-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-w-700 [&_blockquote]:mb-3 [&_a]:text-w-600 [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_img]:my-3 [&_pre]:bg-w-100 [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_code]:text-xs [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:p-2 [&_th]:border-b-2 [&_th]:border-w-400 [&_td]:p-2 [&_td]:border-b [&_td]:border-w-300 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
