FROM node:20-alpine AS builder
WORKDIR /app
COPY gateway/package.json ./
RUN npm install
COPY gateway/nest-cli.json gateway/tsconfig.json ./
COPY gateway/src ./src
COPY .proto ./.proto
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY gateway/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.proto ./.proto
EXPOSE 3000
CMD ["node", "dist/main.js"]
