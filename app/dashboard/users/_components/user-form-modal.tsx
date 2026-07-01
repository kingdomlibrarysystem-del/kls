'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import type { PlatformUser, UserRoleValue, UserStatus } from './users-data'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'librarian', 'admin']),
  status: z.enum(['active', 'inactive', 'suspended']),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalProps {
  open: boolean
  /** Row being edited, or null when creating a new user. */
  editing: PlatformUser | null
  onClose: () => void
  onSave: (data: UserFormData, editingId: string | null) => void
}

/** Create/Edit modal for a platform user — pre-fills from `editing` when editing, blank when creating. */
export function UserFormModal({ open, editing, onClose, onSave }: UserFormModalProps) {
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'user', status: 'active' },
  })

  useEffect(() => {
    if (open) {
      reset(editing ? { name: editing.name, email: editing.email, role: editing.role, status: editing.status } : { name: '', email: '', role: 'user', status: 'active' })
      setSubmitError('')
    }
  }, [open, editing, reset])

  const onSubmit = (data: UserFormData) => {
    try {
      onSave(data, editing?.id ?? null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save user')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit User: ${editing.name}` : 'Add New User'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
            <AlertCircle size={13} /> {submitError}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="name" required>Full Name</FieldLabel>
          <FormInput id="name" type="text" placeholder="e.g. Jane Doe" error={errors.name?.message} {...register('name')} />
        </div>

        <div>
          <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
          <FormInput id="email" type="email" placeholder="name@kingdom.edu" error={errors.email?.message} {...register('email')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="role" required>Role</FieldLabel>
            <select id="role" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('role')}>
              {(['user', 'librarian', 'admin'] as UserRoleValue[]).map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="status" required>Status</FieldLabel>
            <select id="status" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('status')}>
              {(['active', 'inactive', 'suspended'] as UserStatus[]).map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" className="flex-1 text-sm py-2">
            {editing ? 'Save Changes' : 'Add User'}
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose} className="text-sm py-2 px-4">
            Cancel
          </ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
