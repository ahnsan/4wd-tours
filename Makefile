.PHONY: test test-unit test-e2e test-all setup validate start-backend start-frontend help

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup           - Install all dependencies"
	@echo "  make test-unit       - Run unit tests with coverage"
	@echo "  make test-e2e        - Run E2E tests"
	@echo "  make test-all        - Run all tests (unit + e2e)"
	@echo "  make validate        - Run type-check, lint, and tests"
	@echo "  make start-backend   - Start Medusa backend"
	@echo "  make start-frontend  - Start storefront dev server"
	@echo "  make build           - Build storefront for production"
	@echo "  make clean           - Clean build artifacts and coverage"

# Setup
setup:
	@echo "Installing backend dependencies..."
	npm ci
	@echo "Installing storefront dependencies..."
	cd storefront && npm ci
	@echo "Installing Playwright browsers..."
	cd storefront && npx playwright install

# Testing
test-unit:
	@echo "Running unit tests with coverage..."
	cd storefront && npm run test:ci

test-e2e:
	@echo "Running E2E tests..."
	cd storefront && npm run test:e2e

test-all: test-unit test-e2e
	@echo "All tests completed!"

# Validation
validate:
	@echo "Running validation checks..."
	cd storefront && npm run validate

type-check:
	@echo "Running TypeScript type check..."
	cd storefront && npm run type-check

lint:
	@echo "Running linter..."
	cd storefront && npm run lint

lint-fix:
	@echo "Fixing linting issues..."
	cd storefront && npm run lint:fix

# Development
start-backend:
	@echo "Starting Medusa backend on port 9000..."
	npm run dev

start-frontend:
	@echo "Starting storefront on port 8000..."
	cd storefront && npm run dev

# Build
build:
	@echo "Building storefront for production..."
	cd storefront && npm run build

# Deployment
start-prod:
	@echo "Starting production server..."
	cd storefront && npm run start

# Cleanup
clean:
	@echo "Cleaning build artifacts and coverage..."
	rm -rf storefront/.next
	rm -rf storefront/coverage
	rm -rf storefront/playwright-report
	rm -rf storefront/test-results
	@echo "Clean complete!"

# Database
db-migrate:
	@echo "Running database migrations..."
	npm run db:migrate

db-seed:
	@echo "Seeding database..."
	npm run db:seed

# Complete workflow
ci: validate test-all build
	@echo "CI pipeline completed successfully!"
