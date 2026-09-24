'use client'

import { useEffect, useState } from 'react'
import type { NewsCategoryInfo } from './news-data'

/**
 * Real fetch()-backed NewsArticleCategory loader used by the member/public
 * news surfaces so category names and colors come from the DB (admin CRUD at
 * /dashboard/news/categories) instead of a hard-coded map. GET is public —
 * no session needed to color-code published articles.
 */
export function useNewsCategories(): NewsCategoryInfo[] {
  const [categories, setCategories] = useState<NewsCategoryInfo[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/news/categories')
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.code === 'success' && Array.isArray(json.data)) setCategories(json.data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return categories
}