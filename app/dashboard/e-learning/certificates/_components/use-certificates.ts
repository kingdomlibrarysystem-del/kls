'use client'

import { useSyncExternalStore } from 'react'
import { initialCertificates, type Certificate } from './certificates-data'

/**
 * Module-level mutable store so the certificates table and the "Verify by
 * Code" lookup share one list — revoking a certificate in the table is
 * immediately reflected in verification lookups.
 */
let certificates: Certificate[] = [...initialCertificates]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return certificates
}

function nextId() {
  const max = certificates.reduce((m, c) => {
    const n = Number(c.id.replace('cert-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `cert-${String(max + 1).padStart(3, '0')}`
}

function randomCode() {
  const hex = () => Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')
  return `KLS-${hex()}-${hex()}`
}

export function revokeCertificate(id: string) {
  certificates = certificates.map((c) => (c.id === id ? { ...c, revoked: true } : c))
  emitChange()
}

/**
 * Issues a certificate for a member's completed, passed course — a no-op if
 * one already exists for that member+course (dedup by courseId, since
 * eligibility can be recomputed multiple times as the enrollment store
 * changes). Issuance is automatic, fired the moment
 * `isCertificateEligible()` flips true — see use-enrollments.ts's
 * `recordAssessmentAttempt`, the only path that can flip it — rather than
 * requiring a manual admin approval step, since eligibility already
 * encodes the real approval condition (full completion + a passing
 * score) and the data model has no separate review/approval state for
 * certificates the way Publishing submissions do.
 */
export function issueCertificate(member: string, course: string, courseId: string): Certificate | undefined {
  const alreadyIssued = certificates.some((c) => c.courseId === courseId && c.member === member)
  if (alreadyIssued) return undefined
  const created: Certificate = {
    id: nextId(),
    member,
    course,
    courseId,
    issuedAt: new Date().toISOString().slice(0, 10),
    verificationCode: randomCode(),
    revoked: false,
  }
  certificates = [created, ...certificates]
  emitChange()
  return created
}

/** Live-subscribes to the shared certificates store. */
export function useCertificates() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialCertificates)
}
