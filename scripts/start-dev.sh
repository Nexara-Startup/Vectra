#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Vectra - dev server (http://localhost:3000)"
echo "Ensure .env has DATABASE_URL and .env.local has AUTH_SECRET, AUTH_DEV_PASSWORD, AUTH_URL (see .env.example)."
echo "If you see middleware-manifest or chunk errors: npm run dev:fresh"
npm run start:dev
