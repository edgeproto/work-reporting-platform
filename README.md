# Status Reporting Platform

Self-hosted team plans and work reports for office LAN deployment.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL 16 + Prisma
- Tailwind CSS + shadcn/ui
- Docker Compose (app + Postgres + uploads volume)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

App: http://localhost:3000  
Postgres: `localhost:5432` (user/password/db: `reports`)

## Local development

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:migrate
npm run dev
```

## Production (LAN)

```bash
cp .env.example .env
# Set POSTGRES_PASSWORD, APP_URL (e.g. http://192.168.1.50:3000), AUTH_SECRET
docker compose -f docker-compose.prod.yml up --build -d
```

## Database

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## Uploads

Files are stored on the local filesystem at `UPLOAD_DIR` (default `./data/uploads`, `/data/uploads` in Docker).
