# Stage 1: Builder
# Installs dependencies and builds the Next.js app.
# Requires next.config.mjs to have: output: 'standalone'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runner
# Copies only the standalone output for a minimal production image.
FROM node:20-alpine AS runner

WORKDIR /app

# Copy standalone server bundle
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
