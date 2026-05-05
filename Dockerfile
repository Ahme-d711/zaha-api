# ===== Stage 1: Build =====
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package*.json bun.lock* ./
RUN bun install

COPY . .

# Build TypeScript to JavaScript
RUN bun run build

# ===== Stage 2: Run =====
FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json bun.lock* ./
RUN bun install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

RUN mkdir -p uploads

EXPOSE 3131

CMD ["bun", "run", "dist/index.js"]
