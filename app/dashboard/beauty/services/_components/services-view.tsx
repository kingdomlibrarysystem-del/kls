'use client'

import { useState } from 'react'
import { Scissors, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useBeautyProviders, useBeautyServices } from '../../_shared/use-beauty'

/** Service catalog grid, filterable by provider — shows real pricing/duration. */
export function ServicesView() {
  const { data: providers } = useBeautyProviders()
  const { data: services, loading } = useBeautyServices()
  const [providerFilter, setProviderFilter] = useState('all')

  const filtered = providerFilter === 'all' ? services : services.filter((s) => s.providerId === providerFilter)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading services">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2.5 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Scissors} title="No services found" description="Try a different provider filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <div key={service.id} className="border border-w-300 rounded-lg bg-white p-4">
              <p className="font-lato text-xs text-w-600 mb-1">{providers.find((p) => p.id === service.providerId)?.name}</p>
              <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-1">{service.name}</h3>
              <p className="text-xs px-2 py-0.5 bg-w-100 rounded font-lato text-w-700 inline-block mb-2">{service.category}</p>
              {service.description && <p className="font-lato text-xs text-w-700 mb-2">{service.description}</p>}
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-w-950">{service.priceRwf.toLocaleString()} RWF</span>
                <span className="font-lato text-xs text-w-600 flex items-center gap-1"><Clock size={12} /> {service.durationMins} min</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
