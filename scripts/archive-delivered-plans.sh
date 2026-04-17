#!/usr/bin/env bash
# Archive plan files whose linked spec has reached `delivered` or `superseded` status.
#
# Convention:
#   - Plan files live in docs/superpowers/plans/
#   - Each plan's frontmatter may declare `spec: <filename>` referencing a file
#     in docs/superpowers/specs/. If absent, the script falls back to parsing
#     a body line of the form:  **Spec:** `docs/superpowers/specs/<file>.md`
#   - Each plan's frontmatter may declare `status: active|delivered|archived`.
#     Missing status defaults to `active`.
#   - When the linked spec's frontmatter `status` is `delivered` or `superseded`,
#     the plan is moved to docs/archive/plans/ and its frontmatter `status` is
#     rewritten to `archived`.
#
# Idempotent: plans already in archive/ are skipped.
# Run: bash scripts/archive-delivered-plans.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLANS_DIR="$ROOT/docs/superpowers/plans"
ARCHIVE_DIR="$ROOT/docs/archive/plans"
SPECS_DIR="$ROOT/docs/superpowers/specs"

red()    { printf '\033[0;31m%s\033[0m\n' "$1"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }

mkdir -p "$ARCHIVE_DIR"

# Extract frontmatter key from a markdown file.
# Args: $1=file, $2=key. Prints value or empty.
fm_get() {
  awk -v k="$2" '
    /^---$/ { n++; if (n == 2) exit; next }
    n == 1 {
      # match "key: value" or "key:value"
      if (match($0, "^" k ":")) {
        sub("^" k ":[[:space:]]*", "")
        # strip surrounding quotes
        gsub(/^["'\'']|["'\'']$/, "")
        print
        exit
      }
    }
  ' "$1"
}

# Parse a plan's spec reference.
# Tries frontmatter `spec:` first, then falls back to body `**Spec:** `docs/...``.
plan_spec() {
  local plan="$1"
  local spec
  spec=$(fm_get "$plan" "spec")
  if [ -z "$spec" ]; then
    # Parse **Spec:** line from body
    spec=$(grep -oE '\*\*Spec:\*\*[[:space:]]+`[^`]+`' "$plan" 2>/dev/null | head -1 \
      | sed -E 's/.*`([^`]+)`.*/\1/')
    # Reduce to bare filename if full path given
    spec=$(basename "$spec")
  fi
  echo "$spec"
}

ARCHIVED=0
SKIPPED=0
NO_SPEC=0

echo "=== Archive delivered plans ==="
echo ""

for plan in "$PLANS_DIR"/*.md; do
  [ -f "$plan" ] || continue
  plan_base=$(basename "$plan")

  # Skip if already marked archived
  plan_status=$(fm_get "$plan" "status")
  if [ "$plan_status" = "archived" ]; then
    green "SKIP: $plan_base — already archived"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  spec_ref=$(plan_spec "$plan")
  if [ -z "$spec_ref" ]; then
    yellow "NO SPEC: $plan_base — no spec reference in frontmatter or body"
    NO_SPEC=$((NO_SPEC + 1))
    continue
  fi

  spec_path="$SPECS_DIR/$spec_ref"
  if [ ! -f "$spec_path" ]; then
    yellow "BROKEN SPEC REF: $plan_base → $spec_ref (not found in specs/)"
    NO_SPEC=$((NO_SPEC + 1))
    continue
  fi

  spec_status=$(fm_get "$spec_path" "status")
  case "$spec_status" in
    delivered|superseded)
      # Move to archive; update plan frontmatter status to archived.
      dest="$ARCHIVE_DIR/$plan_base"

      # If plan has frontmatter with status field, update it; else add one.
      if [ -n "$plan_status" ]; then
        # Replace existing status
        awk -v newstatus="archived" '
          BEGIN { n = 0 }
          /^---$/ { n++ }
          n == 1 && /^status:/ { print "status: archived"; next }
          { print }
        ' "$plan" > "$dest.tmp"
      else
        # Inject status: archived after the opening ---
        awk -v newstatus="archived" '
          BEGIN { injected = 0 }
          /^---$/ && !injected { print; print "status: archived"; injected = 1; next }
          { print }
        ' "$plan" > "$dest.tmp"
      fi

      mv "$dest.tmp" "$dest"
      rm "$plan"

      yellow "ARCHIVED: $plan_base (spec status: $spec_status) → docs/archive/plans/"
      ARCHIVED=$((ARCHIVED + 1))
      ;;
    draft|active|"")
      green "ACTIVE: $plan_base (spec: $spec_ref, spec-status: ${spec_status:-none})"
      SKIPPED=$((SKIPPED + 1))
      ;;
    *)
      yellow "UNKNOWN SPEC STATUS: $plan_base (spec status: $spec_status)"
      SKIPPED=$((SKIPPED + 1))
      ;;
  esac
done

echo ""
echo "Summary: $ARCHIVED archived, $SKIPPED kept active/already-archived, $NO_SPEC without spec reference"

if [ "$NO_SPEC" -gt 0 ]; then
  echo ""
  yellow "Note: plans without a spec reference cannot be auto-archived."
  yellow "Add 'spec: <filename>' to the plan's frontmatter, or '**Spec:** \`docs/superpowers/specs/<file>.md\`' to its body."
fi
