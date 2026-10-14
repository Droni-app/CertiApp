import 'dotenv/config'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../server/generated/prisma/client'

// Mismo algoritmo (scrypt) que usa hashPassword() de nuxt-auth-utils
const hash = new Hash(new Scrypt({}))
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@certiapp.local'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345'
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrador'

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: await hash.make(password), role: 'admin' },
  })
  console.log(`Admin listo: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
