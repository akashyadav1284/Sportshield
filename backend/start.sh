#!/bin/bash
# SportShield AI — Render startup script
# Runs migrations and seed before starting the app server

set -e

echo "=== Running database migrations ==="
python -m alembic upgrade head

echo "=== Seeding demo data (skips if already exists) ==="
python -m seed

echo "=== Starting SportShield AI server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
