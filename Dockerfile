# ---------- Build stage ----------
FROM node:22-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-bookworm

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

# Create SQLite directory
RUN mkdir -p data

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
#CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]