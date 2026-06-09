FROM golang:1.21-alpine AS builder
WORKDIR /app
# Copy go.mod + go.sum first so the module cache layer is separate from source.
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# CGO_ENABLED=0 produces a fully static binary — no libc needed in the final image.
RUN CGO_ENABLED=0 GOOS=linux go build -o write-service .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/write-service .
EXPOSE 3000
CMD ["./write-service"]
