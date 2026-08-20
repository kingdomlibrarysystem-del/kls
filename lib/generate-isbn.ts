import prisma from '@/prisma/client'

/**
 * A real ISBN-13 with a correct check digit (not just a random string) —
 * uses the 978 Bookland prefix + a random 9-digit body, computed per the
 * standard ISBN-13 checksum (alternating ×1/×3 weights, mod 10). Retries
 * on a genuine collision against the real Resource.isbn unique index
 * rather than trusting randomness alone to never repeat.
 */
function randomIsbn13(): string {
  const registrant = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')
  const digits = `978${registrant}`
  const sum = digits.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  const check = (10 - (sum % 10)) % 10
  return `${digits}${check}`
}

export async function generateUniqueIsbn(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomIsbn13()
    const existing = await prisma.resource.findUnique({ where: { isbn: candidate } })
    if (!existing) return candidate
  }
  throw new Error('Could not generate a unique ISBN after 10 attempts')
}
