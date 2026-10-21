#!/usr/bin/env bash
set -euo pipefail

# Local dev helper for backend
# - Loads `backend/.env` (copy from `.env.example` if missing)
# - Starts ngrok (if available and not running) and sets `YOCO_WEBHOOK_URL`
# - Exports test/sandbox placeholder keys if not present
# - Starts the Spring Boot backend and tails logs

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env found in backend/, copying .env.example -> .env"
  cp .env.example .env
  echo "Please edit 'backend/.env' to add real test keys if you want. Using placeholders for now."
fi

# load environment variables from .env
set -a
. .env
set +a

# Provide safe test placeholders if keys are missing (do not use in production)
: "${YOCO_API_SECRET_KEY:=sk_test_placeholder}"
: "${YOCO_API_PUBLIC_KEY:=pk_test_placeholder}"
: "${YOCO_WEBHOOK_SECRET:=whsec_test_placeholder}"
export YOCO_API_SECRET_KEY YOCO_API_PUBLIC_KEY YOCO_WEBHOOK_SECRET

NGROK_API="http://127.0.0.1:4040/api/tunnels"

start_ngrok() {
  if ! command -v ngrok >/dev/null 2>&1; then
    echo "ngrok not installed or not in PATH. Install ngrok and run 'ngrok config add-authtoken <token>' then retry."
    return 1
  fi
  echo "Starting ngrok tunnel on port 8080..."
  ngrok http 8080 --log=stdout --log-level=info > /tmp/ngrok.log 2>&1 &
  # give ngrok a moment to register
  sleep 2
}

# Ensure ngrok is running (try the API)
if ! curl -s "$NGROK_API" >/dev/null 2>&1; then
  start_ngrok || true
fi

# try to read public URL
NGROK_URL=""
for i in 1 2 3 4 5; do
  NGROK_URL=$(curl -s "$NGROK_API" | python3 -c "import sys,json; j=json.load(sys.stdin) if sys.stdin.readable() else {}; print(j['tunnels'][0]['public_url'] if j.get('tunnels') else '')" 2>/dev/null || true)
  if [ -n "$NGROK_URL" ]; then break; fi
  sleep 1
done

if [ -z "$NGROK_URL" ]; then
  echo "Failed to obtain ngrok public URL. Check /tmp/ngrok.log or start ngrok manually."
  exit 1
fi

export YOCO_WEBHOOK_URL="${NGROK_URL}/api/webhook/yoco"
echo "Using YOCO_WEBHOOK_URL=$YOCO_WEBHOOK_URL"

# Start backend
chmod +x mvnw || true
SPRING_LOG="./spring.log"
SPRING_PID="./spring.pid"

echo "Starting backend (logs -> $SPRING_LOG)"
YOCO_WEBHOOK_URL="$YOCO_WEBHOOK_URL" \
YOCO_WEBHOOK_SECRET="$YOCO_WEBHOOK_SECRET" \
./mvnw -DskipTests spring-boot:run > "$SPRING_LOG" 2>&1 &
echo $! > "$SPRING_PID"

echo "Backend started (pid $(cat $SPRING_PID)). Tailing logs..."
tail -n 200 -f "$SPRING_LOG"
