# Run from repo root or anywhere: starts Next.js in dev mode with a fresh Prisma client.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host 'Vectra - dev server (http://localhost:3000)' -ForegroundColor Cyan
Write-Host 'Ensure .env has DATABASE_URL and .env.local has AUTH_SECRET, AUTH_DEV_PASSWORD, AUTH_URL (see .env.example).' -ForegroundColor DarkGray
Write-Host 'If you see middleware-manifest or chunk errors, stop the server and run: npm run dev:fresh' -ForegroundColor DarkGray
npm run start:dev
