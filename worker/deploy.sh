#!/usr/bin/env bash
# Usage:  CLOUDFLARE_API_TOKEN=... ./deploy.sh
set -e
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Set CLOUDFLARE_API_TOKEN in the env first. Example:"
  echo "  CLOUDFLARE_API_TOKEN=cfut_... ./deploy.sh"
  exit 1
fi
export PATH=/tmp/node20/bin:$PATH
cd "$(dirname "$0")"
npx wrangler deploy
