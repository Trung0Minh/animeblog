import { PrismaClient } from "@prisma/client"

import { getPrismaRuntimeDatabaseUrl } from "@/lib/prismaUrl"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

type PrismaClientOptions = NonNullable<
  ConstructorParameters<typeof PrismaClient>[0]
>

const databaseUrl = getPrismaRuntimeDatabaseUrl()

const prismaOptions: PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
}

if (databaseUrl) {
  prismaOptions.datasources = { db: { url: databaseUrl } }
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
