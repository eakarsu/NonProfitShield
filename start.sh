#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")"&&pwd)";ENV_FILE="$PROJECT_DIR/.env"
load_env_file(){ local line key value;while IFS= read -r line||[ -n "$line" ];do [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]]&&continue;line="${line#export }";key="${line%%=*}";value="${line#*=}";key="${key//[[:space:]]/}";[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]||continue;[ -n "${!key+x}" ]&&continue;if [[ "$value" == \"*\" && "$value" == *\" ]];then value="${value:1:${#value}-2}";elif [[ "$value" == \'*\' && "$value" == *\' ]];then value="${value:1:${#value}-2}";fi;export "$key=$value";done < "$ENV_FILE"; }
[ -f "$ENV_FILE" ]||{ echo "Missing required file: $ENV_FILE" >&2;exit 1; };load_env_file
: "${BACKEND_PORT:?BACKEND_PORT is required}";: "${FRONTEND_PORT:?FRONTEND_PORT is required}";: "${DATABASE_URL:?DATABASE_URL is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}";: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}";: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT";do lsof -nP -iTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1&&{ echo "Assigned port $assigned_port is occupied" >&2;exit 1; };done

[ -d "$PROJECT_DIR/node_modules" ]||{ echo "Dependencies missing" >&2;exit 1; }
export NODE_ENV=development PORT="$FRONTEND_PORT"
export RUNTIME_PROJECT_NAME=NonProfitShield RUNTIME_AI_ENDPOINT=/api/ai/nonprofit-guidance RUNTIME_AI_FEATURE=nonprofit-guidance
export RUNTIME_AI_SYSTEM_PROMPT='You are a nonprofit risk and program-operations assistant. Give cautious, evidence-aware guidance and identify missing facts without making eligibility or legal decisions.'
node "$PROJECT_DIR/runtime/setup.mjs"
(cd "$PROJECT_DIR"&&exec node --import tsx server/scripts/migrate.ts)
CHILD_PIDS=()
(cd "$PROJECT_DIR"&&exec node runtime/api.mjs)&CHILD_PIDS+=("$!")
(cd "$PROJECT_DIR"&&PORT="$FRONTEND_PORT" exec node --import tsx server/index.ts)&CHILD_PIDS+=("$!")
cleanup(){ trap - EXIT INT TERM;for pid in "${CHILD_PIDS[@]}";do kill "$pid" 2>/dev/null||true;done;for pid in "${CHILD_PIDS[@]}";do wait "$pid" 2>/dev/null||true;done; }
trap cleanup EXIT INT TERM
wait "${CHILD_PIDS[@]}"
