FROM golang:1.21-alpine AS builder
WORKDIR /app
# Copy go.mod first so module cache is separate from source layer.
COPY go.mod .
RUN go mod download
COPY . .
# CGO disabled for a fully static binary — no libc needed in the final image.
RUN CGO_ENABLED=0 GOOS=linux go build -o gateway .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/gateway .
EXPOSE 8000
CMD ["./gateway"]
