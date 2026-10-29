# Multi-stage Dockerfile for RestoFlow Go API Server
FROM golang:1.26.2-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/restoflow ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/worker ./cmd/worker

FROM alpine:3.19
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/restoflow /app/restoflow
COPY --from=builder /app/worker /app/worker
COPY --from=builder /app/migrations /app/migrations

EXPOSE 8080
ENTRYPOINT ["/app/restoflow"]
