# Status Reporting Platform

Self-hosted team plans and work reports for office LAN deployment. Team members file forward-looking **plans** and backward-looking **reports**; managers and admins see private entries.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL 16 + Prisma
- Auth.js (email/password, credentials in Postgres)
- Tailwind CSS + shadcn/ui
- Docker Compose (app + Postgres + uploads volume)

## Quick start (Docker)

```bash
cp .env.example .env
# Edit AUTH_SECRET: openssl rand -base64 32
docker compose up --build
```

In another terminal, seed the first admin account:

```bash
docker compose exec app npm run db:seed
```

App: http://localhost:3000  
Default admin: `admin@localhost` / `admin12345` (change after first login)

## Local development

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

App listens on `0.0.0.0:3000` so teammates on the LAN can reach your dev machine if needed.

## Production (office LAN)

Deploy on a machine reachable by your team over the local network (e.g. `http://192.168.1.50:3000`).

```bash
cp .env.example .env
```

Set these in `.env` before starting:

| Variable | Example | Purpose |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | strong random password | Database auth |
| `AUTH_SECRET` | `openssl rand -base64 32` | Session signing |
| `APP_URL` | `http://192.168.1.50:3000` | Password-set links for new users |
| `APP_PORT` | `3000` | Host port to expose |

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml exec app node -e "require('child_process').execSync('npm run db:seed',{stdio:'inherit'})"
```

The app container binds to `0.0.0.0` inside Docker; map `APP_PORT` on the host so LAN clients can connect. HTTP is fine on a trusted office network.

### Volumes

| Volume | Mount | Contents |
|--------|-------|----------|
| `pgdata` | Postgres data dir | Database files |
| `uploads` | `/data/uploads` in app | Report attachment files |

Dev compose also mounts the project directory for hot reload.

### User onboarding (no email)

1. Sign in as admin (seed account).
2. Open **Users** → create account (name, email, role).
3. Copy the password-set link and send it manually (Slack, Teams, in person).
4. User opens the link, sets a password, and signs in.

Regenerate links from the user list if a link expires (7 days) or was already used.

### Backups

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Creates a timestamped folder under `./backups/` with:

- `database.dump` — PostgreSQL custom-format dump
- `uploads.tar.gz` — attachment files from `UPLOAD_DIR`

Restore:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backups/<timestamp>/database.dump
tar -xzf backups/<timestamp>/uploads.tar.gz -C .
```

## Database

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed org + admin user |

## Uploads

Files are stored on the local filesystem at `UPLOAD_DIR` (default `./data/uploads`, `/data/uploads` in Docker). Served only through authenticated download routes.

## Smoke tests

End-to-end smoke test covering admin user creation, password setup, plan/report filing, and manager visibility of private entries.

Prerequisites: seeded database and running app.

```bash
# Terminal 1 — start stack
docker compose up --build
docker compose exec app npm run db:seed

# Terminal 2 — run tests
npm install
npx playwright install chromium
npm run test:e2e
```

Environment overrides:

| Variable | Default |
|----------|---------|
| `BASE_URL` | `http://localhost:3000` |
| `ADMIN_EMAIL` | `admin@localhost` |
| `ADMIN_PASSWORD` | `admin12345` |

## Roles

| Role | Team dashboard | Private entries | Manage users |
|------|----------------|-----------------|--------------|
| Admin | Yes | Yes | Yes |
| Manager | Yes | Yes | No |
| Member | Feed only | Own only | No |
