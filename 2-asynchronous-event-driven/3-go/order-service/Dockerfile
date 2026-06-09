# Stage 1 — build
FROM golang:1.22-alpine AS build
WORKDIR /app

# Copy all source files so go mod tidy can resolve import paths.
COPY . .

# go mod tidy generates go.sum and downloads all dependencies.
# This runs after COPY so it can analyze actual imports in main.go.
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o order-service .

# Stage 2 — runtime
FROM alpine:3.19 AS runtime
WORKDIR /app

COPY --from=build /app/order-service .

ENTRYPOINT ["./order-service"]
