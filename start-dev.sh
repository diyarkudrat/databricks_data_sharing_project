#!/usr/bin/env bash

# Simple helper script to run both backend and webapp dev servers locally.
# Usage:
#   chmod +x start-dev.sh
#   ./start-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR/backend"
echo "Starting backend on http://localhost:4000 ..."
npm run dev &
BACKEND_PID=$!

cd "$ROOT_DIR/webapp"
echo "Starting webapp on http://localhost:3000 ..."
npm run dev &
WEBAPP_PID=$!

echo
echo "Backend PID: $BACKEND_PID"
echo "Webapp  PID: $WEBAPP_PID"
echo "Press Ctrl+C to stop both servers."

trap 'echo "Stopping servers..."; kill $BACKEND_PID $WEBAPP_PID 2>/dev/null || true; wait $BACKEND_PID $WEBAPP_PID 2>/dev/null || true; exit 0' INT TERM

wait $BACKEND_PID $WEBAPP_PID


