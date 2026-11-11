import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** Google may read the public site; signed-in areas, APIs and one-time auth links stay out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/member', '/api', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/certificate'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
