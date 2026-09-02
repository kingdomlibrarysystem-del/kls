'use client'

import { useState } from 'react'
import { Users, UserPlus, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useSupportGroups, joinSupportGroup } from '../../_shared/use-rehab'

/** Browsable group directory with a real Join action, mirrors Health's ClinicsView plus a mutating join button. */
export function GroupsView() {
  const { user } = useAuth()
  const { data: groups, loading } = useSupportGroups()
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const handleJoin = async (groupId: string) => {
    if (!user) return
    try {
      await joinSupportGroup(user.id, groupId)
      setJoined((j) => new Set(j).add(groupId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join this group')
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading groups">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    )
  }

  if (groups.length === 0) {
    return <EmptyState icon={Users} title="No support groups yet" description="Check back soon for available peer support groups." />
  }

  return (
    <div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="border border-w-300 rounded-lg overflow-hidden bg-white">
            <div className="relative w-full h-32 bg-w-200">
              <RemoteImage src={group.image} alt={group.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><Users size={24} className="text-w-400" /></div>} />
            </div>
            <div className="p-4">
              <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-1">{group.name}</h3>
              <p className="font-lato text-xs text-w-600 mb-2 px-2 py-0.5 bg-w-100 rounded inline-block">{group.focus}</p>
              <p className="font-lato text-xs text-w-700 mb-2">{group.description}</p>
              <p className="font-lato text-xs text-w-600 mb-3">Meets: {group.meetingCadence}</p>
              {joined.has(group.id) ? (
                <span className="flex items-center gap-1 text-xs font-lato font-semibold text-green-700"><Check size={13} /> Joined</span>
              ) : (
                <button
                  onClick={() => handleJoin(group.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato font-semibold hover:bg-w-200 transition-colors"
                >
                  <UserPlus size={13} /> Join Group
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
