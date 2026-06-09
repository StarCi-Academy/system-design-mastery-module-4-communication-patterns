# Stage 1 — build the Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy all source files first so go mod tidy sees what packages are imported.
COPY . .

# Generate go.sum by tidying, then download all dependencies.
RUN go mod tidy && go mod download

# Build a static binary.
RUN CGO_ENABLED=0 GOOS=linux go build -o publisher-service .

# Stage 2 — minimal runtime image
FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/publisher-service .

EXPOSE 3001

# Run the publisher service.
ENTRYPOINT ["/app/publisher-service"]
