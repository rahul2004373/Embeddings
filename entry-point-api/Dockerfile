FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock .
RUN bun install --frozen-lockfile

COPY . .

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3001

CMD ["bun", "src/index.ts"]
