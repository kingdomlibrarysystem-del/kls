'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Folder, FolderOpen, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useBookFolders } from '@/app/dashboard/life-sciences/_components/use-life-sciences'

/** Reader-facing folder browser for the Life Sciences module. */
export function MemberFoldersView({ basePath = '/member/life-sciences' }: { basePath?: string } = {}) {
  const { data, loading, error } = useBookFolders()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((folder) => folder.name.toLowerCase().includes(q) || folder.description.toLowerCase().includes(q))
  }, [data, search])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="cinzel" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Life Sciences
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
          Browse free PDF and PowerPoint books, organised by folder.
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 420 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search folders…"
          aria-label="Search folders"
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 150, borderRadius: 10, background: 'var(--bg-section)' }} />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load folders" description={error} style={{ color: 'var(--text-secondary)' }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={data.length === 0 ? 'No folders yet' : 'No folders match your search'}
          description={data.length === 0 ? 'Check back soon — new books are added regularly.' : 'Try a different search term.'}
          style={{ color: 'var(--text-secondary)' }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtered.map((folder) => (
            <Link
              key={folder.id}
              href={`${basePath}/${folder.id}`}
              style={{
                textDecoration: 'none',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 150,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.16)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: 'rgba(212,168,67,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                }}
              >
                <Folder size={20} />
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{folder.name}</div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  flex: 1,
                }}
              >
                {folder.description || 'No description yet.'}
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
                {folder.bookCount} book{folder.bookCount === 1 ? '' : 's'} →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
