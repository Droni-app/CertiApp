# CertiApp

Procesamiento de certificados catastrales. Nuxt 4 + Prisma 7 (MySQL/MariaDB) + nuxt-auth-utils + droni-kit.

## Setup

```bash
npm install
cp .env.example .env          # completa DATABASE_URL y NUXT_SESSION_PASSWORD
npm run db:migrate            # crea las tablas (pide nombre de migración)
npm run db:seed               # crea el admin inicial (SEED_ADMIN_* en .env)
npm run dev
```

## Estructura

- `prisma/schema.prisma` – modelos (el cliente se genera en `server/generated/prisma`)
- `server/utils/prisma.ts` – instancia `prisma` (auto-importada en el server)
- `server/utils/auth.ts` – `requireAdmin(event)`, `toSessionUser(user)`
- `server/middleware/auth.ts` – todo `/api/*` requiere sesión salvo `/api/auth/login`
- `server/api/auth/` – `login`, `logout`, `me`
- `app/middleware/auth.global.ts` – páginas protegidas por defecto; `definePageMeta({ auth: false })` las hace públicas
- `app/middleware/admin.ts` – `definePageMeta({ middleware: 'admin' })` restringe a admins

## Scripts de base de datos

| Script | Descripción |
| --- | --- |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` |
| `npm run db:studio` | Abre Prisma Studio |
