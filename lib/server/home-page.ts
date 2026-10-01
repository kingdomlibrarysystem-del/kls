import { unstable_cache } from 'next/cache'
import { getHomePageData } from '@/lib/data/home'

/**
 * Landing-page data, cached for 60 seconds across requests. The page itself
 * renders per request (the root layout reads the language cookie), so
 * without this every visit would run ~10 database queries; with it they run
 * at most once a minute and new articles/books/view counts still appear
 * within 60 seconds. Tag 'home-page' allows revalidateTag('home-page') after
 * a publish if instant refresh is ever needed.
 */
export const getCachedHomePageData = unstable_cache(getHomePageData, ['home-page-data'], {
  revalidate: 60,
  tags: ['home-page'],
})
