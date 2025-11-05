.PHONY: help install dev build start lint clean type-check preview test format
.DEFAULT_GOAL := help

# Auto-detect package manager
PKG_MANAGER := $(shell if command -v pnpm >/dev/null 2>&1; then echo "pnpm"; elif command -v npm >/dev/null 2>&1; then echo "npm"; else echo "npm"; fi)

# Set run command based on package manager
ifeq ($(PKG_MANAGER),npm)
  RUN_CMD := run
else
  RUN_CMD :=
endif

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Display this help message
	@echo "$(CYAN)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "$(CYAN)Installing dependencies with $(PKG_MANAGER)...$(RESET)"
	$(PKG_MANAGER) install

dev: ## Start development server
	@echo "$(CYAN)Starting development server...$(RESET)"
	$(PKG_MANAGER) $(RUN_CMD) dev

build: ## Build the application for production
	@echo "$(CYAN)Building application...$(RESET)"
	$(PKG_MANAGER) $(RUN_CMD) build

start: ## Start production server
	@echo "$(CYAN)Starting production server...$(RESET)"
	$(PKG_MANAGER) $(RUN_CMD) start

lint: ## Run linter
	@echo "$(CYAN)Running linter...$(RESET)"
	$(PKG_MANAGER) $(RUN_CMD) lint

lint-fix: ## Run linter and fix auto-fixable issues
	@echo "$(CYAN)Running linter with auto-fix...$(RESET)"
	$(PKG_MANAGER) $(RUN_CMD) lint -- --fix

type-check: ## Run TypeScript type checking
	@echo "$(CYAN)Running TypeScript type check...$(RESET)"
	npx tsc --noEmit

clean: ## Clean build artifacts and dependencies
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	rm -rf .next
	rm -rf node_modules
	rm -rf .turbo
	rm -rf dist
	@if [ "$(PKG_MANAGER)" = "pnpm" ]; then rm -f pnpm-lock.yaml; else rm -f package-lock.json; fi

clean-cache: ## Clean Next.js cache
	@echo "$(CYAN)Cleaning Next.js cache...$(RESET)"
	rm -rf .next

fresh-install: clean install ## Clean install dependencies
	@echo "$(GREEN)Fresh install completed!$(RESET)"

preview: build ## Build and start production server
	@echo "$(CYAN)Building and starting production preview...$(RESET)"
	$(MAKE) start

check: type-check lint ## Run all checks (type-check and lint)
	@echo "$(GREEN)All checks passed!$(RESET)"

format: ## Format code (if prettier is available)
	@echo "$(CYAN)Formatting code...$(RESET)"
	@if command -v prettier >/dev/null 2>&1; then \
		npx prettier --write .; \
	else \
		echo "$(YELLOW)Prettier not found. Skipping formatting.$(RESET)"; \
	fi

setup: install ## Initial project setup
	@echo "$(GREEN)Project setup completed!$(RESET)"
	@echo "$(CYAN)Run 'make dev' to start development server$(RESET)"

# Development workflow shortcuts
run: dev ## Alias for dev command

serve: start ## Alias for start command

# Project info
info: ## Display project information
	@echo "$(CYAN)Project Information:$(RESET)"
	@echo "Name: $(shell node -p "require('./package.json').name")"
	@echo "Version: $(shell node -p "require('./package.json').version")"
	@echo "Node version: $(shell node --version)"
	@echo "Package manager: $(PKG_MANAGER) $(shell $(PKG_MANAGER) --version 2>/dev/null || echo 'version unknown')"
	@echo "Next.js version: $(shell node -p "require('./package.json').dependencies.next")" 