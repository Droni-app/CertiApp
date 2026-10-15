# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

# prisma.config.ts exige DATABASE_URL aunque `prisma generate` no se conecta
ENV DATABASE_URL=mysql://build:build@localhost:3306/build

# postinstall ejecuta `prisma generate` y `nuxt prepare`
RUN npm ci

RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
