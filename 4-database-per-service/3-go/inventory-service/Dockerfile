FROM golang:1.21-alpine AS builder
WORKDIR /app
# Download dependencies first for layer caching.
COPY go.mod go.sum ./
RUN go mod download
# Build the binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/inventory-service .
EXPOSE 3012
CMD ["./inventory-service"]
