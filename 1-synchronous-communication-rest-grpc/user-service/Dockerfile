FROM node:20-alpine AS builder
WORKDIR /app
COPY user-service/package.json ./
RUN npm install
COPY user-service/nest-cli.json user-service/tsconfig.json ./
COPY user-service/src ./src
COPY .proto ./.proto
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY user-service/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.proto ./.proto
EXPOSE 5001
CMD ["node", "dist/main.js"]
