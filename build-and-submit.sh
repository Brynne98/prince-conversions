#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/app"
npx eas-cli build --platform "${1:-ios}" --profile production --auto-submit
