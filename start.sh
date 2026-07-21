#!/usr/bin/env bash

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js 20 or newer is required.\n' >&2
  exit 1
fi

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$node_major" -lt 20 ]; then
  printf 'Node.js 20 or newer is required.\n' >&2
  exit 1
fi

runtime_port="${PORT:-5000}"
if [[ ! "$runtime_port" =~ ^[0-9]+$ ]] || [ "$runtime_port" -lt 1 ] || [ "$runtime_port" -gt 65535 ]; then
  printf 'PORT must be an integer between 1 and 65535.\n' >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  printf 'DATABASE_URL is required; provision and migrate PostgreSQL before startup.\n' >&2
  exit 1
fi
session_secret="${SESSION_SECRET:-}"
if [ "${#session_secret}" -lt 32 ]; then
  printf 'SESSION_SECRET must be at least 32 characters.\n' >&2
  exit 1
fi

export PORT="$runtime_port"
export NODE_ENV="${NODE_ENV:-development}"

if [ "$NODE_ENV" = production ]; then
  if [ ! -f dist/index.js ]; then
    printf 'Production build missing; run npm run build before startup.\n' >&2
    exit 1
  fi
  exec node dist/index.js
fi

exec node --import tsx server/index.ts
