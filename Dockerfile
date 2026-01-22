# ---- deps ----
FROM node:22-bullseye-slim AS deps
WORKDIR /app

# Copia os manifests
COPY package.json package-lock.json* ./

# Copia o Prisma ANTES do npm install
COPY prisma ./prisma

# Instala dependências (postinstall agora encontra o schema)
RUN npm install

# ---- build ----
FROM node:22-bullseye-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Build do Next
RUN npm run build

# ---- run ----
FROM node:22-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
