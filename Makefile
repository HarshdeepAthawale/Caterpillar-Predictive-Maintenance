.PHONY: up down build restart logs ps clean

# ── Full stack ───────────────────────────────────────────────
up:
	docker compose up -d

build:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

# ── Individual services ──────────────────────────────────────
logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

# ── Dev (no docker) ──────────────────────────────────────────
dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

# ── Cleanup ──────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	docker image prune -f
