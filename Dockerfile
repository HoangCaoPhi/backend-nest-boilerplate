# Prisma 7 driver adapters ship no Rust query engine, so there are no platform
# binaries to copy between stages — only dist/ and production node_modules.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json tsconfig.json prisma.config.ts ./
COPY src ./src

# Must precede tsc: the generator emits .ts sources that the build compiles.
# prisma.config.ts resolves DATABASE_URL eagerly, but generate never connects — hence the placeholder.
RUN DATABASE_URL="postgresql://placeholder" npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER node
EXPOSE 3000
CMD ["node", "dist/api/main.js"]
