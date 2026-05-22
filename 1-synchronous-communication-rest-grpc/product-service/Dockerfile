FROM node:20-alpine AS builder
WORKDIR /app
COPY product-service/package.json ./
RUN npm install
COPY product-service/nest-cli.json product-service/tsconfig.json ./
COPY product-service/src ./src
COPY .proto ./.proto
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY product-service/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.proto ./.proto
EXPOSE 5002
CMD ["node", "dist/main.js"]
