# syntax=docker/dockerfile:1

# --- build ---
FROM golang:1.26-alpine AS build

WORKDIR /src

# Dependencies are copied first so the module download layer is reused whenever
# only application code changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO is disabled so the binary is fully static and can run on scratch.
# The symbol table and DWARF data are stripped to keep the image small.
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/api ./cmd/api

# --- runtime ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/api /app/api

# Runs unprivileged; distroless static carries no shell or package manager, so
# the attack surface is the binary and nothing else.
USER nonroot:nonroot

EXPOSE 8080
ENTRYPOINT ["/app/api"]
