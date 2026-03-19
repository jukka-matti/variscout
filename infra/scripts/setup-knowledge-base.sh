#!/usr/bin/env bash
set -euo pipefail

# VariScout Knowledge Base Setup
# Creates Foundry IQ Knowledge Base with Remote SharePoint knowledge source
# using the 2025-11-01-preview REST API.
#
# ADR-026: Remote SharePoint approach — on-demand document access with
# per-user permissions, no pre-indexing.

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
  $(basename "$0") --resource-group <rg> --ai-services <name> --sharepoint-url <url>

${BOLD}Required:${NC}
  --resource-group   Azure resource group name
  --ai-services      Azure AI Services account name (for Foundry IQ)
  --sharepoint-url   SharePoint site URL for SOP documents

${BOLD}Optional:${NC}
  -h, --help         Show this help message

${BOLD}Example:${NC}
  $(basename "$0") --resource-group rg-variscout --ai-services vs-ai --sharepoint-url "https://contoso.sharepoint.com/sites/quality"
EOF
  exit 1
}

# ── Argument Parsing ────────────────────────────────────────────────
RESOURCE_GROUP=""
AI_SERVICES=""
SHAREPOINT_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group)
      RESOURCE_GROUP="$2"
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

if [[ -z "$RESOURCE_GROUP" || -z "$AI_SERVICES" || -z "$SHAREPOINT_URL" ]]; then
  echo -e "${RED}Error:${NC} Missing required arguments."
  usage
fi

KB_API_VERSION="2025-11-01-preview"
TOTAL_STEPS=3

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

echo -e "${BOLD}VariScout Knowledge Base Setup${NC}"
echo -e "Resource Group:  ${CYAN}$RESOURCE_GROUP${NC}"
echo -e "AI Services:     ${CYAN}$AI_SERVICES${NC}"
echo -e "SharePoint URL:  ${CYAN}$SHAREPOINT_URL${NC}"

# ── Step 1: Get AI Services endpoint ────────────────────────────────
log_step 1 "Getting AI Services endpoint..."

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

# ── Step 2: Create SharePoint knowledge source (remoteSharePoint) ──
log_step 2 "Creating SharePoint knowledge source (remoteSharePoint)..."

SP_KS_BODY=$(cat <<SPJSON
{
  "kind": "remoteSharePoint",
  "description": "SOPs and procedures from SharePoint (on-demand, per-user permissions)",
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

# ── Step 3: Create knowledge base ───────────────────────────────────
log_step 3 "Creating knowledge base 'variscout-kb'..."

KB_BODY=$(cat <<KBJSON
{
  "description": "VariScout Knowledge Base — Remote SharePoint documents with per-user access control",
  "knowledgeSources": ["sharepoint-sops-ks"],
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
echo -e "  AI Services:        ${CYAN}${AI_ENDPOINT}${NC}"
echo -e "  Knowledge base:     ${CYAN}variscout-kb${NC}"
echo -e "  Knowledge sources:  ${CYAN}sharepoint-sops-ks${NC} (remoteSharePoint)"
echo -e "────────────────────────────────────────────"
echo -e "${YELLOW}Note:${NC} Ensure an OpenAI model connection (gpt-5.4-nano recommended)"
echo -e "      is configured in your AI Services account for KB queries."
