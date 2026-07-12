// Dinas Dukcapil Kab. Ngada - Arsip Digital
import { PrismaClient } from '@prisma/client'

const __globalKey = '__prisma_dukcapil_ngada_v2'

const globalForPrisma = globalThis as unknown as {
  [__globalKey]: PrismaClient | undefined
}

export const db =
  globalForPrisma[__globalKey] ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma[__globalKey] = db