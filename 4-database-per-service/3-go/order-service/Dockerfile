FROM golang:1.21-alpine AS builder
WORKDIR /app
# Download dependencies first for layer caching.
COPY go.mod go.sum ./
RUN go mod download
# Build the binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o order-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/order-service .
EXPOSE 3011
CMD ["./order-service"]
