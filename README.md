# CertiApp

Procesamiento de certificados catastrales. Nuxt 4 + Prisma 7 (MySQL/MariaDB) + nuxt-auth-utils + droni-kit.

## Setup

```bash
npm install
cp .env.example .env          # completa DATABASE_URL y NUXT_SESSION_PASSWORD
npm run db:migrate            # crea las tablas (pide nombre de migración)
npm run db:seed               # crea el admin inicial (SEED_ADMIN_* en .env)
npm run db:seed:cadastral     # importa los CSV de sources/DB (vacía las tablas catastrales)
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

## Administración (CRUD)

Sección `/admin`, solo para rol `admin` (página con middleware `admin` y `/api/admin/*` protegido en `server/middleware/auth.ts`).

Es genérica y se define en `shared/utils/adminResources.ts`: cada recurso declara sus campos (tipo, validación, relaciones, sugerencias), columnas, búsqueda y listados relacionados. Para agregar un recurso nuevo basta con añadir su entrada ahí.

| Endpoint | Descripción |
| --- | --- |
| `GET /api/admin/:resource` | Listado: `page`, `pageSize`, `search`, `sort`, `dir` y filtros exactos por campo (`?propertyNumber=...`) |
| `GET /api/admin/:resource/:id` | Detalle |
| `POST /api/admin/:resource` | Crear (errores de validación → 422 con `data.errors` por campo) |
| `PUT /api/admin/:resource/:id` | Editar |
| `DELETE /api/admin/:resource/:id` | Eliminar (en cascada sobre registros relacionados) |
| `GET /api/admin/:resource/suggestions?field=` | Valores existentes de un campo de categoría |
| `GET /api/admin/stats` | Totales por recurso |

## Scripts de base de datos

| Script | Descripción |
| --- | --- |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` (admin inicial) |
| `npm run db:seed:cadastral [-- <dir>]` | Importa los CSV catastrales; reporte en `.data/import-report.json` |
| `npm run db:studio` | Abre Prisma Studio |

## Modelo catastral

El número predial (`properties.number`, 30 dígitos) es la llave que relaciona todo.

| Tabla | CSV de origen | Relación |
| --- | --- | --- |
| `properties` | Predios | Principal. `matrix_number` → predio matriz (PH/condominio) |
| `constructions` | Construcciones | N por predio |
| `horizontal_properties` | DatosPH_Condominio | 1 por predio |
| `administrative_sources` | FuentesAdministrativas | N por predio |
| `parties` | Interesados (persona) | Persona natural o jurídica |
| `property_owners` | Interesados (relación) | Predio ↔ persona, con orden, derecho y participación |
| `cadastral_procedures` | TramitesCatastrales | N por predio |
| `land_zones` | Zonas | N por predio |

Notas de la importación:

- Los predios referenciados en otras tablas pero ausentes en Predios.csv se crean con `is_placeholder = true`.
- Las categorías (destinación, condición, tipo de fuente, mutación...) se unifican a su variante más frecuente.
- Decimales con coma, fechas seriales de Excel y fechas con día y mes invertidos se corrigen; `1900-01-01` y los valores inválidos quedan en `null`.
- `property_owners.right_type = null` significa Propietario(a).
- En `schema.prisma` cada campo indica con `///` su columna de origen en el CSV.

## Despliegue (Docker)

Producción en `https://certiapp.droni.vip` detrás de `nginx-proxy` + `acme-companion` (redes externas `nginx-proxy` y `cluster`). La base de datos es `certiapp` en el contenedor `cluster-mysql` (alias `mysql`).

```bash
# .env con DATABASE_URL (host mysql), NUXT_SESSION_PASSWORD y SEED_ADMIN_*
docker compose build
docker compose run --rm tools npm run db:deploy            # migraciones
docker compose run --rm tools npm run db:seed              # admin inicial
docker compose run --rm tools npm run db:seed:cadastral    # importa sources/DB (montado como volumen)
docker compose up -d app
```

Para actualizar: `git pull && docker compose build && docker compose run --rm tools npm run db:deploy && docker compose up -d app`.
