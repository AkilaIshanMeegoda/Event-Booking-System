# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Stage 2: Build the Next.js app ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Service URLs passed as build args (used by next.config.ts during build)
ARG USER_SERVICE_URL=http://localhost:5001
ARG EVENT_SERVICE_URL=http://localhost:5002
ARG PAYMENT_SERVICE_URL=http://localhost:5003
ARG BOOKING_SERVICE_URL=http://localhost:5004
ARG REVIEW_SERVICE_URL=http://localhost:5005
ARG NOTIFICATION_SERVICE_URL=http://localhost:5006
ARG REPORTING_SERVICE_URL=http://localhost:5007
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

ENV USER_SERVICE_URL=$USER_SERVICE_URL
ENV EVENT_SERVICE_URL=$EVENT_SERVICE_URL
ENV PAYMENT_SERVICE_URL=$PAYMENT_SERVICE_URL
ENV BOOKING_SERVICE_URL=$BOOKING_SERVICE_URL
ENV REVIEW_SERVICE_URL=$REVIEW_SERVICE_URL
ENV NOTIFICATION_SERVICE_URL=$NOTIFICATION_SERVICE_URL
ENV REPORTING_SERVICE_URL=$REPORTING_SERVICE_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
