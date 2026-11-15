#!/usr/bin/env bash
# ==============================================================================
# EARTHY — Earth Analog Research & Exploration Platform
# Startup script: Launches Flask web server and serves 3D workstation
# ==============================================================================

set -e

PORT="${PORT:-5050}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================================="
echo "🌍 Starting EARTHY Planetary Analog Research Platform"
echo "=================================================================="
echo "Directory: ${DIR}"
echo "Port:      ${PORT}"
echo "URL:       http://localhost:${PORT}"
echo "=================================================================="

export PATH="/usr/local/bin:$PATH"

if [ -x "/usr/local/bin/python3.11" ]; then
    PY_BIN="/usr/local/bin/python3.11"
elif command -v python3.11 >/dev/null 2>&1; then
    PY_BIN="python3.11"
elif command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
else
    echo "Error: Python 3 not found."
    exit 1
fi

echo "Using Python runtime: $(${PY_BIN} --version)"
export PYTHONPATH="${DIR}/backend:${PYTHONPATH}"

exec ${PY_BIN} "${DIR}/backend/app.py"
