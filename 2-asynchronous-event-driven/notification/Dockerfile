FROM node:20-alpine AS builder
WORKDIR /app
# Install dependencies first (cache layer)
COPY package.json ./
RUN npm install
# Copy build config and source
COPY nest-cli.json tsconfig.json ./
COPY src ./src
# Build TypeScript to dist/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Install production-only deps
COPY package.json ./
RUN npm install --omit=dev
# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
