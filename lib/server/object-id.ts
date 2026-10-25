import { randomBytes } from 'node:crypto'

/** True for a 24-char hex MongoDB ObjectId. Prisma throws (500) on a malformed id instead of returning null, so data loaders check this first and treat a bad id as "not found". */
export function isObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/** A fresh MongoDB ObjectId (4-byte seconds timestamp + 8 random bytes), for when a record's id is needed before it is inserted. */
export function newObjectId(): string {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  return ts + randomBytes(8).toString('hex')
}
