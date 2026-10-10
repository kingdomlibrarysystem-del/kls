import { PrismaClient } from "@prisma/client";

/**
 * Database the TEST SUITE uses. Tests must never touch the real database
 * (they used to read DATABASE_URL, which pointed at production, and left
 * "Vitest …" users behind). Under Vitest the client connects ONLY to
 * TEST_DATABASE_URL, and refuses to start when it is missing, is the same as
 * DATABASE_URL, or names a database containing "prod". vitest.config.ts
 * passes TEST_DATABASE_URL in from .env.
 */
function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL?.trim();
  const help = "Set TEST_DATABASE_URL in .env to a separate test database (e.g. …mongodb.net/kls_db_test), then run `npm run test:db-setup` once.";
  if (!url) throw new Error(`Tests are not allowed to use the real database. ${help}`);
  const dbName = (url.split("?")[0].split("/").pop() ?? "").toLowerCase();
  if (url === process.env.DATABASE_URL?.trim() || dbName.includes("prod") || !dbName) {
    throw new Error(`TEST_DATABASE_URL must point at a test database, not "${dbName || "(none)"}". ${help}`);
  }
  return url;
}

const prismaClientSingleton = () => {
  return process.env.VITEST
    ? new PrismaClient({ datasources: { db: { url: testDatabaseUrl() } } })
    : new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
