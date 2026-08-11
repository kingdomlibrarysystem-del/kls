import { describe, it, expect } from 'vitest'
import { roleNameToUserRole } from '../auth-context'

describe('roleNameToUserRole', () => {
  it('maps admin/administrator to "admin"', () => {
    expect(roleNameToUserRole('Admin')).toBe('admin')
    expect(roleNameToUserRole('Administrator')).toBe('admin')
    expect(roleNameToUserRole('ADMIN')).toBe('admin')
  })

  it('maps manager to "manager"', () => {
    expect(roleNameToUserRole('Manager')).toBe('manager')
  })

  it('maps staff to "staff"', () => {
    expect(roleNameToUserRole('Staff')).toBe('staff')
  })

  it('defaults anything unrecognized to "member"', () => {
    expect(roleNameToUserRole('Member')).toBe('member')
    expect(roleNameToUserRole('Contributor')).toBe('member')
    expect(roleNameToUserRole('Some Random Role')).toBe('member')
    expect(roleNameToUserRole('')).toBe('member')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(roleNameToUserRole('  admin  ')).toBe('admin')
    expect(roleNameToUserRole('MANAGER')).toBe('manager')
  })
})
