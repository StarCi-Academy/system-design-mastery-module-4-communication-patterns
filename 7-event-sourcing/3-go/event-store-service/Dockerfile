FROM golang:1.21-alpine AS builder
WORKDIR /app
# Download dependencies first (layer cache).
COPY go.mod go.sum ./
RUN go mod download
# Copy source and build a statically-linked binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o event-store-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/event-store-service .
EXPOSE 3000
CMD ["./event-store-service"]
