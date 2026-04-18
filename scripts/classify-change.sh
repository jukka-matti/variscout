#!/usr/bin/env bash
# classify-change.sh — classify a list of paths as tooling | product | mixed.
#
# Usage:
#   echo "docs/OVERVIEW.md" | bash scripts/classify-change.sh
#   bash scripts/classify-change.sh packages/core/src/stats/foo.ts CLAUDE.md
#
# Emits exactly one word on stdout: tooling | product | mixed | empty

set -u

# Collect paths: stdin lines + argv
paths=()
if [ $# -gt 0 ]; then
  for p in "$@"; do paths+=("$p"); done
fi
if [ ! -t 0 ]; then
  while IFS= read -r line; do
    [ -n "$line" ] && paths+=("$line")
  done
fi

if [ ${#paths[@]} -eq 0 ]; then
  echo empty
  exit 0
fi

is_tooling() {
  case "$1" in
    .claude/*|scripts/*|docs/*|tools/*|.husky/*|.github/*) return 0 ;;
    CLAUDE.md|package.json|pnpm-workspace.yaml|pnpm-lock.yaml|turbo.json) return 0 ;;
    *) return 1 ;;
  esac
}

is_product() {
  case "$1" in
    packages/*/src/*|apps/*/src/*) return 0 ;;
    packages/*/package.json|apps/*/package.json) return 0 ;;
    packages/*/tsconfig.json|apps/*/tsconfig.json) return 0 ;;
    *) return 1 ;;
  esac
}

has_tooling=0
has_product=0
for p in "${paths[@]}"; do
  if is_product "$p"; then
    has_product=1
  elif is_tooling "$p"; then
    has_tooling=1
  else
    # Unknown path (e.g. root config file we haven't classified) — treat as tooling
    # to avoid false-positive product warnings.
    has_tooling=1
  fi
done

if [ "$has_product" = "1" ] && [ "$has_tooling" = "1" ]; then
  echo mixed
elif [ "$has_product" = "1" ]; then
  echo product
else
  echo tooling
fi
