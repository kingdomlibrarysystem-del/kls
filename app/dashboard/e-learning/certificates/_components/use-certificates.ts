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

export function revokeCertificate(id: string) {
  certificates = certificates.map((c) => (c.id === id ? { ...c, revoked: true } : c))
  emitChange()
}

/** Live-subscribes to the shared certificates store. */
export function useCertificates() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialCertificates)
}
