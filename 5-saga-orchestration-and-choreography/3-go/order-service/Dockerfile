FROM golang:1.21-alpine AS builder
WORKDIR /app
# Copy go.mod first so the module download layer is cached separately.
COPY go.mod .
RUN go mod download
COPY . .
# CGO disabled — produces a fully static binary; no libc required in final image.
RUN CGO_ENABLED=0 GOOS=linux go build -o order-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/order-service .
EXPOSE 3001
CMD ["./order-service"]
