FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
# Static binary; runs on bare alpine without glibc.
RUN CGO_ENABLED=0 GOOS=linux go build -o user-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/user-service .
EXPOSE 3001
CMD ["./user-service"]
