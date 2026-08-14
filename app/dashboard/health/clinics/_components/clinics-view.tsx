'use client'

import { useState } from 'react'
import { MapPin, Stethoscope as StethoscopeIcon, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { useClinics } from '../../_shared/use-health'

/** Searchable/filterable directory of partnered clinics and practitioners. */
export function ClinicsView() {
  const { data: clinics, loading } = useClinics()
  const [search, setSearch] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  const specialties = ['all', ...Array.from(new Set(clinics.map((c) => c.specialty)))]

  const filtered = clinics.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty = specialtyFilter === 'all' || c.specialty === specialtyFilter
    return matchesSearch && matchesSpecialty
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading clinics">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
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
            placeholder="Search by clinic name or location..."
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
        <EmptyState icon={StethoscopeIcon} title="No clinics found" description="Try a different search term or specialty filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((clinic) => (
            <div key={clinic.id} className="border border-w-300 rounded-lg overflow-hidden bg-white">
              <div className="relative w-full h-32 bg-w-200">
                <RemoteImage src={clinic.image} alt={clinic.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><StethoscopeIcon size={24} className="text-w-400" /></div>} />
              </div>
              <div className="p-4">
                <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-1">{clinic.name}</h3>
                <p className="font-lato text-xs text-w-600 mb-2 px-2 py-0.5 bg-w-100 rounded inline-block">{clinic.specialty}</p>
                <p className="font-lato text-xs text-w-700 flex items-center gap-1"><MapPin size={12} /> {clinic.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
