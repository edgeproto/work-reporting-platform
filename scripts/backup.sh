#!/usr/bin/env bash
# Backup PostgreSQL database and uploaded files for the Status Reporting Platform.
#
# Usage:
#   ./scripts/backup.sh [output-directory]
#
# Defaults:
#   output-directory: ./backups
#   Reads DATABASE_URL, UPLOAD_DIR from .env when present.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BACKUP_DIR="${1:-./backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="${BACKUP_DIR}/${TIMESTAMP}"
UPLOAD_DIR="${UPLOAD_DIR:-./data/uploads}"

mkdir -p "$RUN_DIR"

echo "Writing backup to ${RUN_DIR}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Dumping database…"
  pg_dump "$DATABASE_URL" --format=custom --file="${RUN_DIR}/database.dump"
else
  echo "DATABASE_URL not set — skipping database dump." >&2
fi

if [[ -d "$UPLOAD_DIR" ]]; then
  echo "Archiving uploads from ${UPLOAD_DIR}…"
  tar -czf "${RUN_DIR}/uploads.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
else
  echo "Upload directory ${UPLOAD_DIR} not found — skipping uploads archive." >&2
fi

cat > "${RUN_DIR}/README.txt" <<EOF
Status Reporting Platform backup
Created: ${TIMESTAMP}

Files:
  database.dump  — PostgreSQL custom-format dump (pg_restore)
  uploads.tar.gz   — Uploaded attachment files

Restore database:
  pg_restore --clean --if-exists --dbname="\$DATABASE_URL" database.dump

Restore uploads:
  tar -xzf uploads.tar.gz -C /path/to/restore/parent
EOF

echo "Backup complete: ${RUN_DIR}"
