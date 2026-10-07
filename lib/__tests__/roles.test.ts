import { describe, it, expect } from 'vitest'
import { roleNameToUserRole } from '../roles'

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

  it('keeps Member and a missing role name as "member"', () => {
    expect(roleNameToUserRole('Member')).toBe('member')
    expect(roleNameToUserRole('  MEMBER ')).toBe('member')
    expect(roleNameToUserRole('')).toBe('member')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(roleNameToUserRole('  admin  ')).toBe('admin')
    expect(roleNameToUserRole('MANAGER')).toBe('manager')
  })

  it('sends every other (admin-created) role to the dashboard as staff, never as admin', () => {
    expect(roleNameToUserRole('Graphic Design Manager')).toBe('staff')
    expect(roleNameToUserRole('Contributor')).toBe('staff')
    expect(roleNameToUserRole('Some Random Role')).toBe('staff')
  })
})
