#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

check_absent() {
  local label="$1"
  local pattern="$2"
  shift 2
  local paths=("$@")

  if rg -n --hidden --glob '!**/dist/**' --glob '!**/node_modules/**' --glob '!**/coverage/**' "$pattern" "${paths[@]}"; then
    echo "ADR-093 guard failed: ${label}" >&2
    fail=1
  fi
}

check_absent \
  "in-product voice capture returned" \
  'VoiceInput|VoiceDraftButton|speechService|transcribeAudio|VOICE_INPUT|MediaRecorder|getUserMedia|SpeechRecognition' \
  apps/pwa/src apps/azure/src packages/*/src

check_absent \
  "live membership or ACL surface returned" \
  'ProjectMember|Invitation|canAccess|useProjectMembershipStore|PendingInvitesBanner|InviteModal|NoAccess' \
  apps/pwa/src apps/azure/src packages/*/src

check_absent \
  "Azure Blob document persistence returned" \
  'cloudSync|blobClient|SaveConflict|If-Match|STORAGE_ACCOUNT|Blob document|Azure Storage' \
  apps/pwa/src apps/azure/src apps/azure/server.js packages/*/src

check_absent \
  "product-mobile surface returned" \
  'MobileTabBar|MobileMenu|MobileDashboard|MobileChartCarousel|EditorMobileSheet|MobileCategorySheet|mobileAnalyzeWall|AnalyzeWallMobile' \
  apps/pwa/src apps/azure/src packages/*/src

bash scripts/check-free-artifact-bundle.sh

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "ADR-093 guardrails passed"
