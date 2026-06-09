# Stage 1 — build
FROM golang:1.22-alpine AS build
WORKDIR /app

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o notification-service .

# Stage 2 — runtime
FROM alpine:3.19 AS runtime
WORKDIR /app

COPY --from=build /app/notification-service .

ENTRYPOINT ["./notification-service"]
