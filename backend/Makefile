.DEFAULT_GOAL := help

DATABASE_URL ?= postgres://abtekindo:abtekindo@localhost:5432/abtekindo?sslmode=disable
MIGRATE := go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: run
run: ## Run the API locally
	go run ./cmd/api

.PHONY: build
build: ## Compile the API binary to bin/api
	go build -trimpath -o bin/api ./cmd/api

.PHONY: test
test: ## Run all tests
	go test ./... -race -count=1

.PHONY: vet
vet: ## Run go vet
	go vet ./...

.PHONY: lint
lint: ## Run golangci-lint
	golangci-lint run

.PHONY: check
check: vet test ## Run vet and tests

.PHONY: sqlc
sqlc: ## Regenerate type-safe query code from db/queries
	go run github.com/sqlc-dev/sqlc/cmd/sqlc generate

.PHONY: migrate-up
migrate-up: ## Apply all pending migrations
	$(MIGRATE) -path db/migrations -database "$(DATABASE_URL)" up

.PHONY: migrate-down
migrate-down: ## Roll back the most recent migration
	$(MIGRATE) -path db/migrations -database "$(DATABASE_URL)" down 1

.PHONY: migrate-force
migrate-force: ## Clear a dirty migration state: make migrate-force VERSION=1
	$(MIGRATE) -path db/migrations -database "$(DATABASE_URL)" force $(VERSION)

.PHONY: migrate-new
migrate-new: ## Create a migration pair: make migrate-new NAME=add_something
	$(MIGRATE) create -ext sql -dir db/migrations -seq $(NAME)

.PHONY: seed
seed: ## Load seed catalog data into the database
	go run ./cmd/seed

.PHONY: create-admin
create-admin: ## Create an admin user: make create-admin EMAIL=you@example.com NAME="Your Name"
	go run ./cmd/createadmin -email "$(EMAIL)" -name "$(NAME)"

.PHONY: openapi
openapi: ## Write the OpenAPI spec to openapi.json for frontend type generation
	go run ./cmd/openapi > openapi.json
