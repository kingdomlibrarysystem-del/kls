'use client'

import { MessageCircle, EyeOff } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useCounselingNotes } from '../../_shared/use-counseling'

/** Read-only note/follow-up list per completed session, mirrors Health's RecordsView. Shows a "withheld" state when the API redacts per consent settings. */
export function HistoryView() {
  const { user } = useAuth()
  const notes = useCounselingNotes(user?.id)

  if (notes.length === 0) {
    return <EmptyState icon={MessageCircle} title="No session notes yet" description="Notes from your completed sessions will appear here." />
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const withheld = note.summary === 'Withheld per your privacy settings.'
        return (
          <div key={note.id} className="border border-w-300 rounded-lg bg-white p-4">
            <p className="font-lato text-xs text-w-600 mb-2">{new Date(note.createdAt).toLocaleDateString()}</p>
            {withheld ? (
              <p className="font-lato text-sm text-w-600 flex items-center gap-2 italic"><EyeOff size={14} /> Withheld per your privacy settings.</p>
            ) : (
              <>
                <p className="font-lato text-sm text-w-950">{note.summary}</p>
                {note.followUp && <p className="font-lato text-xs text-w-700 mt-2"><span className="font-semibold">Follow-up:</span> {note.followUp}</p>}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
