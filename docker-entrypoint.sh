#!/bin/sh
# Generate runtime-config.js from Cloud Run environment variables on container start.
# Exposes values on window.RUNTIME_CONFIG so the SPA can read them after build time.

set -eu

OUT=/usr/share/nginx/html/runtime-config.js

API_KEY_VALUE="${GEMINI_API_KEY:-${API_KEY:-}}"

cat > "$OUT" <<EOF
window.RUNTIME_CONFIG = {
  API_KEY: $(printf '%s' "$API_KEY_VALUE" | awk 'BEGIN{printf "\""} {gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); printf "%s", $0} END{printf "\""}')
};
EOF

echo "runtime-config.js generated"
