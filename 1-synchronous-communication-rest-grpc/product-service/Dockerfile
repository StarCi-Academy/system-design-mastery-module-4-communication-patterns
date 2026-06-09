FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY proto ./proto
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto
EXPOSE 5002
CMD ["node", "dist/main.js"]
