import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Lazy-init Prisma client. Two reasons:
//   1. Next.js dev hot-reload — cache on globalThis to avoid pool exhaustion.
//   2. `next build` collects page data without env vars set; module-level
//      `new PrismaClient()` would throw. Lazy init defers env-check until
//      first query (request time).

declare global {
  // eslint-disable-next-line no-var
  var __chanakyaPrisma: PrismaClient | undefined;
}

function makePrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getPrisma(): PrismaClient {
  if (globalThis.__chanakyaPrisma) return globalThis.__chanakyaPrisma;
  const client = makePrisma();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__chanakyaPrisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = getPrisma();
    const value = Reflect.get(real, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});
