FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o product-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/product-service .
EXPOSE 3002
CMD ["./product-service"]
