'use client'

import { useState } from 'react'
import { Search, Users as UsersIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { useCounselors } from '../../_shared/use-counseling'

/** Searchable/filterable directory of accredited counselors, mirrors Health's ClinicsView. */
export function CounselorsView() {
  const { data: counselors, loading } = useCounselors()
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  const specialties = ['all', ...Array.from(new Set(counselors.map((c) => c.specialty)))]

  const filtered = counselors.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty = specialtyFilter === 'all' || c.specialty === specialtyFilter
    return matchesSearch && matchesSpecialty
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading counselors">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-500" />
          <input
            type="text"
            placeholder="Search by counselor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-3 py-2.5 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        >
          {specialties.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Specialties' : s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No counselors found" description="Try a different search term or specialty filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((counselor) => (
            <div key={counselor.id} className="border border-w-300 rounded-lg overflow-hidden bg-white">
              <div className="relative w-full h-32 bg-w-200">
                <RemoteImage src={counselor.image} alt={counselor.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><UsersIcon size={24} className="text-w-400" /></div>} />
              </div>
              <div className="p-4">
                <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-1">{counselor.name}</h3>
                <p className="font-lato text-xs text-w-600 mb-2 px-2 py-0.5 bg-w-100 rounded inline-block">{counselor.specialty}</p>
                {counselor.bio && <p className="font-lato text-xs text-w-700">{counselor.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
