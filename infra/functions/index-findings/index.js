/**
 * Findings Indexer Azure Function
 *
 * Indexes findings from a VariScout project into Azure AI Search
 * for cross-project Knowledge Base search.
 *
 * Environment variables:
 *   SEARCH_ENDPOINT  — Azure AI Search endpoint URL
 *   SEARCH_API_KEY   — Azure AI Search admin API key
 *   SEARCH_INDEX     — Search index name (default: "findings")
 *   CLIENT_ID        — Azure AD App Registration client ID (for token validation)
 *   ALLOWED_ORIGIN   — CORS allowed origin (defaults to '*' for dev)
 */

/**
 * CORS headers applied to every response.
 */
function getCorsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN;
  if (!origin) throw new Error('ALLOWED_ORIGIN environment variable is required');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Extract tenant ID from EasyAuth bearer token.
 * Returns null if token is invalid or missing tenant claim.
 */
function extractTenantId(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.tid || null;
  } catch {
    return null;
  }
}

/**
 * Transform a Finding into a search document.
 */
function transformFinding(finding, projectName, projectId, hypothesisMap, tenantId) {
  const hypothesis = finding.hypothesisId ? hypothesisMap[finding.hypothesisId] : null;
  const factor = hypothesis?.factor || Object.keys(finding.context?.activeFilters || {})[0] || '';
  const etaSquared = finding.context?.cumulativeScope != null
    ? finding.context.cumulativeScope / 100
    : null;

  return {
    '@search.action': 'mergeOrUpload',
    id: `${projectId}_${finding.id}`,
    finding_id: finding.id,
    project_id: projectId,
    project_name: projectName,
    text: finding.text || '',
    factor,
    status: finding.status || 'observed',
    tag: finding.tag || '',
    eta_squared: etaSquared,
    cpk_before: finding.context?.stats?.cpk ?? null,
    cpk_after: finding.outcome?.cpkAfter ?? null,
    suspected_cause: hypothesis?.text || '',
    hypothesis_text: hypothesis?.text || '',
    actions_text: (finding.actions || []).map(a => a.text).join('; '),
    outcome_effective: finding.outcome?.effective === 'yes' ? true
      : finding.outcome?.effective === 'no' ? false
      : null,
    owner_tenant_id: tenantId,
    created_at: new Date(finding.createdAt).toISOString(),
  };
}

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    context.res = { status: 405, headers: corsHeaders, body: { error: 'Method not allowed' } };
    return;
  }

  // Validate auth — extract tenant ID for multi-tenant isolation
  const tenantId = extractTenantId(req.headers?.authorization);
  if (!tenantId) {
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Missing or invalid authorization' },
    };
    return;
  }

  // Validate request body
  const { projectName, projectId, findings, hypotheses } = req.body || {};
  if (!projectName || !projectId || !Array.isArray(findings)) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Missing required fields: projectName, projectId, findings' },
    };
    return;
  }

  const searchEndpoint = process.env.SEARCH_ENDPOINT;
  const searchApiKey = process.env.SEARCH_API_KEY;
  const searchIndex = process.env.SEARCH_INDEX || 'findings';

  if (!searchEndpoint || !searchApiKey) {
    context.res = {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Search service not configured' },
    };
    return;
  }

  try {
    // Build hypothesis lookup map
    const hypothesisMap = {};
    if (Array.isArray(hypotheses)) {
      for (const h of hypotheses) {
        if (h.id) hypothesisMap[h.id] = h;
      }
    }

    // Transform findings to search documents
    const documents = findings.map(f =>
      transformFinding(f, projectName, projectId, hypothesisMap, tenantId)
    );

    // Index documents via Azure AI Search REST API
    const indexUrl = `${searchEndpoint}/indexes/${searchIndex}/docs/index?api-version=2024-07-01`;
    const indexResponse = await fetch(indexUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': searchApiKey,
      },
      body: JSON.stringify({ value: documents }),
    });

    if (!indexResponse.ok) {
      const errorText = await indexResponse.text();
      context.log.error('Search indexing failed:', indexResponse.status, errorText);
      context.res = {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: { error: 'Search indexing failed', status: indexResponse.status },
      };
      return;
    }

    const indexResult = await indexResponse.json();
    const indexed = indexResult.value?.filter(r => r.status === true || r.statusCode === 200 || r.statusCode === 201).length ?? documents.length;

    // Delete stale documents for this project that are no longer in findings array
    const currentIds = new Set(findings.map(f => `${projectId}_${f.id}`));
    let deleted = 0;

    // Search for existing documents in this project
    const searchUrl = `${searchEndpoint}/indexes/${searchIndex}/docs/search?api-version=2024-07-01`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': searchApiKey,
      },
      body: JSON.stringify({
        filter: `project_id eq '${projectId.replace(/'/g, "''")}' and owner_tenant_id eq '${tenantId.replace(/'/g, "''")}'`,
        select: 'id',
        top: 1000,
      }),
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      const staleIds = (searchResult.value || [])
        .map(doc => doc.id)
        .filter(id => !currentIds.has(id));

      if (staleIds.length > 0) {
        const deleteDocuments = staleIds.map(id => ({
          '@search.action': 'delete',
          id,
        }));

        const deleteResponse = await fetch(indexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': searchApiKey,
          },
          body: JSON.stringify({ value: deleteDocuments }),
        });

        if (deleteResponse.ok) {
          deleted = staleIds.length;
        }
      }
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { indexed, deleted },
    };
  } catch (err) {
    context.log.error('Indexing error:', err.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Internal error during indexing' },
    };
  }
};
