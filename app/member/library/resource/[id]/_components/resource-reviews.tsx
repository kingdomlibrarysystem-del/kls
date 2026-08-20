'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)} aria-label={`${i + 1} star${i === 0 ? '' : 's'}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <Star size={20} color="var(--gold)" fill={i < value ? 'var(--gold)' : 'none'} />
        </button>
      ))}
    </div>
  )
}

/** Real review list + submit form for a resource — one review per user, editable in place (POST is an upsert), backing Resource.avgRating/reviewCount shown on cards. */
export function ResourceReviews({ resourceId }: { resourceId: string }) {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetch(`/api/reviews?resourceId=${resourceId}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success') setReviews(json.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [resourceId])

  const myReview = reviews.find((r) => r.userId === user?.id)

  useEffect(() => {
    if (myReview) { setRating(myReview.rating); setComment(myReview.comment ?? '') }
  }, [myReview?.id])

  const handleSubmit = async () => {
    if (!user || rating === 0) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId, rating, comment: comment.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not save your review')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myReview) return
    setSubmitting(true)
    try {
      await fetch(`/api/reviews/${myReview.id}`, { method: 'DELETE' })
      setRating(0)
      setComment('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 className="cinzel" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Reviews ({reviews.length})</h2>

      {isAuthenticated && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StarInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this resource (optional)…"
            rows={3}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical' }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--red-light)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: rating === 0 || submitting ? 'not-allowed' : 'pointer', opacity: rating === 0 || submitting ? 0.6 : 1 }}
            >
              {myReview ? 'Update Review' : 'Submit Review'}
            </button>
            {myReview && (
              <button onClick={handleDelete} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red-light)', fontSize: 13, cursor: 'pointer' }}>
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.userName}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} color="var(--gold)" fill={i < r.rating ? 'var(--gold)' : 'none'} />)}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
