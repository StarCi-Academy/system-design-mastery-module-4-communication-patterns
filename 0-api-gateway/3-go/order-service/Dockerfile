FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o order-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/order-service .
EXPOSE 3003
CMD ["./order-service"]
