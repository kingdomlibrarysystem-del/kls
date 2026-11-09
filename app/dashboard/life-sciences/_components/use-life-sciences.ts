'use client'

import { useCallback, useEffect, useState } from 'react'
import type { BookFolder, FolderBook } from '@/lib/data/book-folders'

/** Fetches all folders (active only for members, active + archived for staff). */
export function useBookFolders({ includeArchived = false }: { includeArchived?: boolean } = {}) {
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState<{ key: string; data: BookFolder[]; error: string | null }>({
    key: '',
    data: [],
    error: null,
  })
  const key = `${includeArchived ? '1' : '0'}:${tick}`

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (includeArchived) params.set('includeArchived', '1')
    fetch(`/api/book-folders?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to load folders')
        return json.data as BookFolder[]
      })
      .then((folders) => { if (!cancelled) setResult({ key, data: folders, error: null }) })
      .catch((err) => {
        if (!cancelled) setResult((prev) => ({ ...prev, key, error: err instanceof Error ? err.message : 'Failed to load folders' }))
      })
    return () => { cancelled = true }
  }, [includeArchived, key])

  return { data: result.data, loading: result.key !== key, error: result.error, refetch }
}

/** Fetches books, optionally scoped to one folder. */
export function useFolderBooks({
  folderId,
  includeArchived = false,
}: {
  folderId?: string
  includeArchived?: boolean
} = {}) {
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState<{ key: string; data: FolderBook[]; error: string | null }>({
    key: '',
    data: [],
    error: null,
  })
  const key = `${folderId ?? ''}:${includeArchived ? '1' : '0'}:${tick}`

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (folderId) params.set('folderId', folderId)
    if (includeArchived) params.set('includeArchived', '1')
    fetch(`/api/folder-books?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to load books')
        return json.data as FolderBook[]
      })
      .then((books) => { if (!cancelled) setResult({ key, data: books, error: null }) })
      .catch((err) => {
        if (!cancelled) setResult((prev) => ({ ...prev, key, error: err instanceof Error ? err.message : 'Failed to load books' }))
      })
    return () => { cancelled = true }
  }, [folderId, includeArchived, key])

  return { data: result.data, loading: result.key !== key, error: result.error, refetch }
}

async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? fallback)
  return json.data as T
}

export function createBookFolder(input: { name: string; description?: string; sortOrder?: number }): Promise<BookFolder> {
  return request<BookFolder>(
    '/api/book-folders',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) },
    'Failed to create folder',
  )
}

export function updateBookFolder(
  id: string,
  updates: { name?: string; description?: string; status?: 'active' | 'archived'; sortOrder?: number },
): Promise<BookFolder> {
  return request<BookFolder>(
    `/api/book-folders/${id}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) },
    'Failed to update folder',
  )
}

export function archiveBookFolder(id: string): Promise<BookFolder> {
  return updateBookFolder(id, { status: 'archived' })
}

export async function deleteBookFolder(id: string): Promise<void> {
  await request<null>(`/api/book-folders/${id}`, { method: 'DELETE' }, 'Failed to delete folder')
}

export interface FolderBookInput {
  folderId: string
  title: string
  description: string
  author: string
  documentUrl: string
  documentName: string
  documentType: string
  documentSize?: number | null
}

export function createFolderBook(input: FolderBookInput): Promise<FolderBook> {
  return request<FolderBook>(
    '/api/folder-books',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) },
    'Failed to add book',
  )
}

export function updateFolderBook(
  id: string,
  updates: Partial<FolderBookInput> & { status?: 'active' | 'archived' },
): Promise<FolderBook> {
  return request<FolderBook>(
    `/api/folder-books/${id}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) },
    'Failed to update book',
  )
}

export function archiveFolderBook(id: string): Promise<FolderBook> {
  return updateFolderBook(id, { status: 'archived' })
}

export async function deleteFolderBook(id: string): Promise<void> {
  await request<null>(`/api/folder-books/${id}`, { method: 'DELETE' }, 'Failed to delete book')
}
