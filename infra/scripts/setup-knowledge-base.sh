#!/usr/bin/env bash
set -euo pipefail

# VariScout Knowledge Base Setup
# Creates Azure AI Search index and Foundry IQ Knowledge Base
# using the 2025-11-01-preview REST API.

# ── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Usage ───────────────────────────────────────────────────────────
usage() {
  cat <<EOF
${BOLD}Usage:${NC}
  $(basename "$0") --resource-group <rg> --search-service <name> --ai-services <name> [--sharepoint-url <url>]

${BOLD}Required:${NC}
  --resource-group   Azure resource group name
  --search-service   Azure AI Search service name
  --ai-services      Azure AI Services account name (for Foundry IQ)

${BOLD}Optional:${NC}
  --sharepoint-url   SharePoint site URL for SOP indexing
  -h, --help         Show this help message

${BOLD}Examples:${NC}
  $(basename "$0") --resource-group rg-variscout --search-service vs-search --ai-services vs-ai
  $(basename "$0") --resource-group rg-variscout --search-service vs-search --ai-services vs-ai --sharepoint-url "https://contoso.sharepoint.com/sites/quality"
EOF
  exit 1
}

# ── Argument Parsing ────────────────────────────────────────────────
RESOURCE_GROUP=""
SEARCH_SERVICE=""
AI_SERVICES=""
SHAREPOINT_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --search-service)
      SEARCH_SERVICE="$2"
      shift 2
      ;;
    --ai-services)
      AI_SERVICES="$2"
      shift 2
      ;;
    --sharepoint-url)
      SHAREPOINT_URL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo -e "${RED}Error:${NC} Unknown argument: $1"
      usage
      ;;
  esac
done

if [[ -z "$RESOURCE_GROUP" || -z "$SEARCH_SERVICE" || -z "$AI_SERVICES" ]]; then
  echo -e "${RED}Error:${NC} Missing required arguments."
  usage
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEARCH_INDEX_SCHEMA="$SCRIPT_DIR/../search-index-schema.json"
SEARCH_API_VERSION="2024-07-01"
KB_API_VERSION="2025-11-01-preview"

# ── Helpers ─────────────────────────────────────────────────────────
log_step() { echo -e "\n${CYAN}[$1/${TOTAL_STEPS}]${NC} ${BOLD}$2${NC}"; }
log_ok()   { echo -e "  ${GREEN}OK${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}WARN${NC} $1"; }
log_fail() { echo -e "  ${RED}FAIL${NC} $1"; exit 1; }

# ── Pre-flight ──────────────────────────────────────────────────────
if ! command -v az &> /dev/null; then
  log_fail "Azure CLI (az) is not installed. Install it from https://aka.ms/install-az-cli"
fi

if ! command -v jq &> /dev/null; then
  log_fail "jq is not installed. Install it from https://jqlang.github.io/jq/download/"
fi

if [[ ! -f "$SEARCH_INDEX_SCHEMA" ]]; then
  log_fail "Search index schema not found at $SEARCH_INDEX_SCHEMA"
fi

TOTAL_STEPS=6
if [[ -n "$SHAREPOINT_URL" ]]; then
  TOTAL_STEPS=7
fi

echo -e "${BOLD}VariScout Knowledge Base Setup${NC}"
echo -e "Resource Group:  ${CYAN}$RESOURCE_GROUP${NC}"
echo -e "Search Service:  ${CYAN}$SEARCH_SERVICE${NC}"
echo -e "AI Services:     ${CYAN}$AI_SERVICES${NC}"
if [[ -n "$SHAREPOINT_URL" ]]; then
  echo -e "SharePoint URL:  ${CYAN}$SHAREPOINT_URL${NC}"
fi

# ── Step 1: Get search service endpoint ─────────────────────────────
log_step 1 "Getting search service endpoint..."

SEARCH_ENDPOINT=$(az search service show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$SEARCH_SERVICE" \
  --query "hostName" -o tsv 2>/dev/null) || log_fail "Could not retrieve search service endpoint"

SEARCH_ENDPOINT="https://${SEARCH_ENDPOINT}"
log_ok "Endpoint: $SEARCH_ENDPOINT"

# ── Step 2: Get search admin key ────────────────────────────────────
log_step 2 "Getting search service admin key..."

SEARCH_ADMIN_KEY=$(az search admin-key show \
  --resource-group "$RESOURCE_GROUP" \
  --service-name "$SEARCH_SERVICE" \
  --query "primaryKey" -o tsv 2>/dev/null) || log_fail "Could not retrieve search admin key"

log_ok "Admin key retrieved"

# ── Step 3: Create search index ─────────────────────────────────────
log_step 3 "Creating search index from schema..."

INDEX_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${SEARCH_ENDPOINT}/indexes?api-version=${SEARCH_API_VERSION}" \
  -H "Content-Type: application/json" \
  -H "api-key: ${SEARCH_ADMIN_KEY}" \
  -d @"$SEARCH_INDEX_SCHEMA")

INDEX_HTTP_CODE=$(echo "$INDEX_RESPONSE" | tail -1)
INDEX_BODY=$(echo "$INDEX_RESPONSE" | sed '$d')

if [[ "$INDEX_HTTP_CODE" -ge 200 && "$INDEX_HTTP_CODE" -lt 300 ]]; then
  INDEX_NAME=$(echo "$INDEX_BODY" | jq -r '.name // "unknown"')
  log_ok "Index created: $INDEX_NAME"
elif [[ "$INDEX_HTTP_CODE" -eq 409 ]]; then
  log_warn "Index already exists (409 Conflict) — skipping"
else
  echo "$INDEX_BODY" | jq . 2>/dev/null || echo "$INDEX_BODY"
  log_fail "Failed to create search index (HTTP $INDEX_HTTP_CODE)"
fi

# ── Step 4: Get AI Services endpoint ────────────────────────────────
log_step 4 "Getting AI Services endpoint..."

AI_ENDPOINT=$(az cognitiveservices account show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$AI_SERVICES" \
  --query "properties.endpoint" -o tsv 2>/dev/null) || log_fail "Could not retrieve AI Services endpoint"

# Remove trailing slash if present
AI_ENDPOINT="${AI_ENDPOINT%/}"
log_ok "Endpoint: $AI_ENDPOINT"

# Get access token for AI Services API
AI_TOKEN=$(az account get-access-token \
  --resource "https://cognitiveservices.azure.com" \
  --query "accessToken" -o tsv 2>/dev/null) || log_fail "Could not get access token"

log_ok "Access token acquired"

# ── Step 5: Create findings knowledge source ────────────────────────
log_step 5 "Creating findings knowledge source (searchIndex)..."

FINDINGS_KS_BODY=$(cat <<'KSJSON'
{
  "kind": "searchIndex",
  "description": "Indexed findings from VariScout projects",
  "searchIndexConnection": {
    "searchServiceResourceId": "__SEARCH_RESOURCE_ID__",
    "indexName": "variscout-findings"
  }
}
KSJSON
)

SEARCH_RESOURCE_ID=$(az search service show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$SEARCH_SERVICE" \
  --query "id" -o tsv 2>/dev/null) || log_fail "Could not get search service resource ID"

FINDINGS_KS_BODY=$(echo "$FINDINGS_KS_BODY" | sed "s|__SEARCH_RESOURCE_ID__|${SEARCH_RESOURCE_ID}|g")

KS_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "${AI_ENDPOINT}/knowledgesources/findings-ks?api-version=${KB_API_VERSION}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AI_TOKEN}" \
  -d "$FINDINGS_KS_BODY")

KS_HTTP_CODE=$(echo "$KS_RESPONSE" | tail -1)
KS_BODY=$(echo "$KS_RESPONSE" | sed '$d')

if [[ "$KS_HTTP_CODE" -ge 200 && "$KS_HTTP_CODE" -lt 300 ]]; then
  log_ok "Knowledge source 'findings-ks' created"
elif [[ "$KS_HTTP_CODE" -eq 409 ]]; then
  log_warn "Knowledge source 'findings-ks' already exists — skipping"
else
  echo "$KS_BODY" | jq . 2>/dev/null || echo "$KS_BODY"
  log_fail "Failed to create findings knowledge source (HTTP $KS_HTTP_CODE)"
fi

# ── Step 5b (optional): Create SharePoint knowledge source ──────────
CURRENT_STEP=6
if [[ -n "$SHAREPOINT_URL" ]]; then
  log_step "$CURRENT_STEP" "Creating SharePoint knowledge source (indexedSharePoint)..."

  SP_KS_BODY=$(cat <<SPJSON
{
  "kind": "indexedSharePoint",
  "description": "SOPs and procedures from SharePoint",
  "sharePointConnection": {
    "siteUrl": "${SHAREPOINT_URL}"
  }
}
SPJSON
)

  SP_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${AI_ENDPOINT}/knowledgesources/sharepoint-sops-ks?api-version=${KB_API_VERSION}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AI_TOKEN}" \
    -d "$SP_KS_BODY")

  SP_HTTP_CODE=$(echo "$SP_RESPONSE" | tail -1)
  SP_BODY=$(echo "$SP_RESPONSE" | sed '$d')

  if [[ "$SP_HTTP_CODE" -ge 200 && "$SP_HTTP_CODE" -lt 300 ]]; then
    log_ok "Knowledge source 'sharepoint-sops-ks' created"
  elif [[ "$SP_HTTP_CODE" -eq 409 ]]; then
    log_warn "Knowledge source 'sharepoint-sops-ks' already exists — skipping"
  else
    echo "$SP_BODY" | jq . 2>/dev/null || echo "$SP_BODY"
    log_fail "Failed to create SharePoint knowledge source (HTTP $SP_HTTP_CODE)"
  fi

  CURRENT_STEP=7
fi

# ── Step N: Create knowledge base ───────────────────────────────────
log_step "$CURRENT_STEP" "Creating knowledge base 'variscout-kb'..."

KB_SOURCES='["findings-ks"'
if [[ -n "$SHAREPOINT_URL" ]]; then
  KB_SOURCES="${KB_SOURCES}, \"sharepoint-sops-ks\""
fi
KB_SOURCES="${KB_SOURCES}]"

KB_BODY=$(cat <<KBJSON
{
  "description": "VariScout Knowledge Base — findings + optional SharePoint documents",
  "knowledgeSources": ${KB_SOURCES},
  "retrievalReasoningEffort": { "kind": "low" },
  "outputMode": "ExtractedData"
}
KBJSON
)

KB_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "${AI_ENDPOINT}/knowledgebases/variscout-kb?api-version=${KB_API_VERSION}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AI_TOKEN}" \
  -d "$KB_BODY")

KB_HTTP_CODE=$(echo "$KB_RESPONSE" | tail -1)
KB_BODY_RESP=$(echo "$KB_RESPONSE" | sed '$d')

if [[ "$KB_HTTP_CODE" -ge 200 && "$KB_HTTP_CODE" -lt 300 ]]; then
  log_ok "Knowledge base 'variscout-kb' created"
else
  echo "$KB_BODY_RESP" | jq . 2>/dev/null || echo "$KB_BODY_RESP"
  log_fail "Failed to create knowledge base (HTTP $KB_HTTP_CODE)"
fi

# ── Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${NC}"
echo -e "────────────────────────────────────────────"
echo -e "  Search endpoint:    ${CYAN}${SEARCH_ENDPOINT}${NC}"
echo -e "  Search index:       ${CYAN}variscout-findings${NC}"
echo -e "  AI Services:        ${CYAN}${AI_ENDPOINT}${NC}"
echo -e "  Knowledge base:     ${CYAN}variscout-kb${NC}"
echo -e "  Knowledge sources:  ${CYAN}findings-ks${NC}"
if [[ -n "$SHAREPOINT_URL" ]]; then
  echo -e "                      ${CYAN}sharepoint-sops-ks${NC}"
fi
echo -e "────────────────────────────────────────────"
echo -e "${YELLOW}Note:${NC} Ensure an OpenAI model connection (gpt-4o-mini recommended)"
echo -e "      is configured in your AI Services account for KB queries."
