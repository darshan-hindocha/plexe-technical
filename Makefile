.PHONY: help dev test lint clean build gen-types backend frontend docker-build docker-up docker-down install

# Colors for help output
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Plexe ML Service - Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing development tools..."
	cd frontend && npm install openapi-typescript --save-dev

dev: ## Start development servers
	@echo "Starting development environment..."
	@echo "Backend will be available at http://localhost:8000"
	@echo "Frontend will be available at http://localhost:3000"
	@echo "API docs will be available at http://localhost:8000/docs"
	docker-compose up --build

backend: ## Start only the backend service
	@echo "Starting backend at http://localhost:8000..."
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend: ## Start only the frontend service
	@echo "Starting frontend at http://localhost:3000..."
	cd frontend && npm run dev

gen-types: ## Generate TypeScript types from OpenAPI schema
	@echo "Generating TypeScript types..."
	./scripts/gen_types.sh

test: ## Run tests
	@echo "🧪 Running comprehensive backend tests..."
	@echo "   Testing API endpoints, model upload, predictions, and workflows"
	cd backend && source .venv/bin/activate && pytest app/tests/ -v --tb=short
	@echo ""
	@echo "🎯 Running frontend tests..."
	cd frontend && npm test --passWithNoTests
	@echo ""
	@echo "✅ All tests completed!"
	@echo "💡 Note: Chat tests require API keys for full functionality"

test-quick: ## Run tests with minimal output
	@echo "🧪 Running quick test suite..."
	cd backend && source .venv/bin/activate && pytest app/tests/ -q
	@echo "✅ Quick tests passed!"

verify: ## Verify core functionality works (no API keys needed)
	@echo "🔍 Verifying core functionality..."
	@echo "💡 This tests upload → predict workflow without requiring API keys"
	@echo "📋 Make sure the application is running first: make dev"
	python verify_setup.py

lint: ## Run linting
	@echo "Linting backend..."
	cd backend && source .venv/bin/activate && ruff check app/
	@echo "Linting frontend..."
	cd frontend && npm run lint

build: ## Build the application for production
	@echo "Building application..."
	docker-compose build

docker-build: ## Build Docker images
	@echo "Building Docker images..."
	docker-compose build

docker-up: ## Start services with Docker Compose
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

docker-down: ## Stop Docker Compose services
	@echo "Stopping Docker Compose services..."
	docker-compose down

docker-logs: ## Show Docker Compose logs
	docker-compose logs -f

clean: ## Clean up generated files
	@echo "Cleaning up..."
	cd backend && rm -rf .venv __pycache__ .pytest_cache storage/
	cd frontend && rm -rf .next node_modules
	docker-compose down -v
	docker system prune -f

# Default target
.DEFAULT_GOAL := help 