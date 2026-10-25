import { AlertTriangle, Trash2, Archive, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { PlatformUser } from './users-data'
import type { DeleteProgress } from './use-users'

export type DeleteMode = 'trash' | 'permanent'

interface DeleteUserModalProps {
  user: PlatformUser | null
  /** "trash" = soft delete (restorable); "permanent" = remove the account and its own data. */
  mode: DeleteMode
  /** True while the request runs: buttons show a spinner and the modal cannot be closed. */
  busy?: boolean
  /** Permanent delete only: steps finished so far, streamed from the server — shown as a percentage inside the button. */
  progress?: DeleteProgress | null
  onClose: () => void
  onConfirm: (user: PlatformUser, mode: DeleteMode) => void
}

/** Confirmation before moving a user to Trash, or deleting them permanently (with live progress). */
export function DeleteUserModal({ user, mode, busy = false, progress = null, onClose, onConfirm }: DeleteUserModalProps) {
  const permanent = mode === 'permanent'
  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0
  // While deleting, closing would hide the result; the request keeps running either way.
  const close = () => { if (!busy) onClose() }

  return (
    <Modal open={!!user} onClose={close} title={permanent ? 'Delete User Permanently' : 'Move User to Trash'} size="sm">
      {user && (
        <div>
          {permanent ? (
            <>
              <div className="flex items-center gap-2 bg-red-50 dark:bg-destructive/10 border border-red-200 dark:border-destructive/30 rounded p-3 mb-4">
                <AlertTriangle size={14} className="text-red-600 dark:text-destructive shrink-0" />
                <p className="font-lato text-xs text-red-700 dark:text-destructive">This action cannot be undone.</p>
              </div>
              <p className="font-lato text-xs text-w-700 dark:text-muted-foreground mb-3">
                Their account and everything that is only theirs is removed too: orders, cart, borrow history, reservations,
                reviews, course enrollments and results, certificates, messages, comments and likes. If they wrote content
                others use or still have a book out, deletion is refused.
              </p>
            </>
          ) : (
            <p className="font-lato text-xs text-w-700 dark:text-muted-foreground mb-3">
              Nothing is erased. The user is signed out, cannot sign in, and is hidden from the user list. You can restore
              them from the Trash tab at any time, or delete them permanently there.
            </p>
          )}
          <p className="font-lato text-sm text-w-700 mb-4">
            {permanent ? 'Permanently delete' : 'Move'} <span className="font-semibold text-w-950">&ldquo;{user.name}&rdquo;</span>{permanent ? '?' : ' to Trash?'}
          </p>

          <div className="flex gap-2">
            <ElegantButton
              variant="primary"
              onClick={() => onConfirm(user, mode)}
              disabled={busy}
              aria-busy={busy}
              aria-live="polite"
              className={`flex-1 text-sm py-2 flex items-center justify-center gap-1.5 disabled:cursor-wait disabled:opacity-80 ${permanent ? 'bg-red-600 border-red-700 hover:bg-red-700' : ''}`}
            >
              {busy
                ? <><Loader2 size={14} className="animate-spin" /> {permanent ? <>Deleting… <span className="tabular-nums">{percent}%</span></> : 'Moving to Trash…'}</>
                : permanent
                  ? <><Trash2 size={14} /> Delete Permanently</>
                  : <><Archive size={14} /> Move to Trash</>}
            </ElegantButton>
            <ElegantButton variant="outline" onClick={close} disabled={busy} className="flex-1 text-sm py-2 disabled:opacity-50">
              Cancel
            </ElegantButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
