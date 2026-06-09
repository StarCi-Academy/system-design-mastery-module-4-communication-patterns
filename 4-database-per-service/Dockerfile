FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nest build order && npx nest build inventory

FROM node:18-alpine
ARG NEST_APP=order
ENV NEST_APP=$NEST_APP
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "node dist/apps/${NEST_APP}/main.js"]
