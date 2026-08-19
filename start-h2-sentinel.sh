#!/usr/bin/env sh
exec node "$(dirname "$0")/scripts/h2-sentinel/launch.mjs" "$@"
