'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, BellOff, BellRing, Search } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

export function SubscribersView() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchSubscribers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/newsletter/subscribers')
      const json = await res.json()
      setSubscribers(json.data ?? [])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubscribers() }, [fetchSubscribers])

  const toggle = async (sub: Subscriber) => {
    setActionId(sub.id)
    await fetch(`/api/newsletter/subscribers/${sub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !sub.active }),
    })
    await fetchSubscribers(true)
    setActionId(null)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this subscriber permanently?')) return
    setActionId(id)
    await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' })
    await fetchSubscribers(true)
    setActionId(null)
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const active = subscribers.filter((s) => s.active).length

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-w-950">{subscribers.length}</p>
          <p className="font-lato text-xs text-w-700 mt-1">Total Subscribers</p>
        </div>
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-green-700">{active}</p>
          <p className="font-lato text-xs text-w-700 mt-1">Active</p>
        </div>
        <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className="font-cinzel text-2xl font-bold text-w-600">{subscribers.length - active}</p>
          <p className="font-lato text-xs text-w-700 mt-1">Disabled</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-500" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 font-lato text-sm border border-w-300 rounded focus:outline-none focus:border-w-600 bg-white"
        />
      </div>

      {loading ? (
        <p className="font-lato text-sm text-w-600 py-8 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="font-lato text-sm text-w-600 py-8 text-center">No subscribers found.</p>
      ) : (
        <div className="border border-w-300 rounded-lg overflow-hidden">
          <table className="w-full text-sm font-lato">
            <thead className="bg-form-highlight border-b border-w-300">
              <tr>
                <th className="text-left px-4 py-3 text-w-700 font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-w-700 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-w-700 font-semibold">Subscribed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => (
                <tr key={sub.id} className={`border-t border-w-200 ${i % 2 === 0 ? 'bg-white' : 'bg-form-highlight/40'}`}>
                  <td className="px-4 py-3 text-w-950">{sub.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sub.active ? 'bg-green-100 text-green-700' : 'bg-w-200 text-w-600'}`}>
                      {sub.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-w-600 text-xs">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggle(sub)}
                        disabled={actionId === sub.id}
                        title={sub.active ? 'Disable' : 'Enable'}
                        className="p-1.5 rounded hover:bg-w-200 text-w-600 hover:text-w-950 transition-colors disabled:opacity-40"
                      >
                        {sub.active ? <BellOff size={14} /> : <BellRing size={14} />}
                      </button>
                      <button
                        onClick={() => remove(sub.id)}
                        disabled={actionId === sub.id}
                        title="Remove"
                        className="p-1.5 rounded hover:bg-red-50 text-w-500 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
