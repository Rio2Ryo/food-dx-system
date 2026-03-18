import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Create a PrismaClient backed by Cloudflare D1.
 * Call this when you have a D1Database binding (e.g. from Cloudflare Workers context).
 */
export function getDb(d1: D1Database) {
  const adapter = new PrismaD1(d1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter: adapter as any });
}

// ---------------------------------------------------------------------------
// For local development (SQLite file via standard Prisma datasource)
// ---------------------------------------------------------------------------
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const localPrisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = localPrisma;

export { localPrisma as prisma };

// ---------------------------------------------------------------------------
// Unified helper – works on both Cloudflare (D1) and local dev (SQLite).
//
// Usage in API routes:
//   const prisma = await getPrisma();
// ---------------------------------------------------------------------------
export async function getPrisma(): Promise<PrismaClient> {
  try {
    // @opennextjs/cloudflare exposes getCloudflareContext for edge/worker env
    const { getCloudflareContext } = await import(
      "@opennextjs/cloudflare" as string
    );
    const { env } = await getCloudflareContext();
    if (env?.DB) {
      return getDb(env.DB as D1Database);
    }
  } catch {
    // Not running on Cloudflare – fall through to local client
  }
  return localPrisma;
}
