'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Users, BookOpen, ArrowRight } from 'lucide-react'
import { UsersView } from './_components/users-view'

/**
 * The Digital Library tab here previously duplicated /dashboard/library's
 * resource CRUD with a non-functional "Add Resource" form — rather than
 * maintaining two divergent copies of the same resource-management logic,
 * this tab now links out to the fully-featured, working library page.
 */
export default function UsersAndLibraryPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'resources'>('users')

  return (
    <PageTransition>
      <PageHeader title="Admin Dashboard" subtitle="Manage platform users and digital library resources" />

      <div className="flex gap-2 mb-8 border-b border-w-300">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-lato font-semibold transition-colors ${activeTab === 'users' ? 'text-w-950 border-b-2 border-w-600' : 'text-w-700 hover:text-w-950'}`}
        >
          <Users size={16} className="inline-block mr-1" /> User Management
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-3 font-lato font-semibold transition-colors ${activeTab === 'resources' ? 'text-w-950 border-b-2 border-w-600' : 'text-w-700 hover:text-w-950'}`}
        >
          <BookOpen size={16} className="inline-block mr-1" /> Digital Library
        </button>
      </div>

      {activeTab === 'users' && <UsersView />}

      {activeTab === 'resources' && (
        <div className="bg-form-highlight border border-w-300 rounded-lg p-8 text-center">
          <BookOpen size={28} className="mx-auto text-w-600 mb-3" />
          <h2 className="font-cinzel text-lg font-semibold text-w-950 mb-2">Digital Library Management</h2>
          <p className="font-lato text-sm text-w-700 mb-4 max-w-md mx-auto">
            Full resource inventory, creation, and editing now lives on the dedicated Book Inventory page.
          </p>
          <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 px-4 py-2 bg-w-600 text-white rounded font-lato text-sm font-semibold hover:bg-w-700 transition-colors">
            Go to Book Inventory <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </PageTransition>
  )
}
