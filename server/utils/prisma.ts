import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

const createClient = () =>
  new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })

// Reutiliza la instancia entre recargas en dev para no agotar conexiones
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> }

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
