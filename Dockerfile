# Stage 1: Repository klonen
FROM alpine/git:latest AS cloner
WORKDIR /app
RUN git clone https://github.com/PrinzMichiDE/free-epg.de.git .

# Stage 2: Abhängigkeiten installieren
FROM node:20-alpine AS deps
WORKDIR /app
# Kopiere package Dateien vom cloner stage
COPY --from=cloner /app/package.json /app/package-lock.json* ./
RUN npm ci

# Stage 3: Build der Anwendung
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=cloner /app .
COPY --from=deps /app/node_modules ./node_modules

# Wichtig: Für den Standalone-Build muss die Config angepasst sein
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Sicherheits-User
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere die Standalone-Build-Ergebnisse
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
