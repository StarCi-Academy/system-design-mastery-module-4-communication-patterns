# Stage 1 — build the Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY . .

RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o subscriber-notification .

# Stage 2 — minimal runtime image
FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/subscriber-notification .

# Run the notification subscriber service.
ENTRYPOINT ["/app/subscriber-notification"]
