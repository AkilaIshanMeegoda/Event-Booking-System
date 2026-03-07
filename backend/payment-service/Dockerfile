FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER nodejs
EXPOSE 5003
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5003/health || exit 1
CMD ["node", "src/server.js"]
