import { PrismaClient } from "@/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrisma> };

function createPrisma() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({
    accelerateUrl: process.env.DATABASE_URL,
  }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
