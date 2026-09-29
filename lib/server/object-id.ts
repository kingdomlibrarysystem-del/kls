/** True for a 24-char hex MongoDB ObjectId. Prisma throws (500) on a malformed id instead of returning null, so data loaders check this first and treat a bad id as "not found". */
export function isObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}
