# ─── Estágio 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependência primeiro (cache layer)
COPY package*.json ./
COPY prisma/ ./prisma/

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código-fonte
COPY . .

# Build TypeScript
RUN npm run build

# ─── Estágio 2: Produção ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copiar apenas o necessário do estágio de build
COPY package*.json ./
COPY prisma/ ./prisma/

# Instalar apenas dependências de produção
RUN npm ci --omit=dev

# Copiar Prisma Client gerado e binários do estágio de build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copiar build compilado do estágio anterior
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Aplicar schema no banco e iniciar a aplicação (removido --skip-generate)
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
