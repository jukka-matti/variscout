/**
 * Tests for the Findings Indexer Azure Function.
 *
 * Run with: cd infra/functions && npm test
 */

const indexFindings = require('../index');

// Helper to create a mock Azure Function context
function createContext() {
  return {
    log: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
    res: null,
  };
}

// Helper to create a valid Bearer token with tenant ID
function createMockToken(tid = 'test-tenant-123') {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ tid, aud: 'test-client' })).toString('base64url');
  const signature = 'fake-signature';
  return `${header}.${payload}.${signature}`;
}

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  process.env.SEARCH_ENDPOINT = 'https://test.search.windows.net';
  process.env.SEARCH_API_KEY = 'test-key';
  process.env.SEARCH_INDEX = 'findings';
  process.env.CLIENT_ID = 'test-client';
  mockFetch.mockReset();
});

describe('index-findings function', () => {
  it('handles CORS preflight', async () => {
    const context = createContext();
    await indexFindings(context, { method: 'OPTIONS' });
    expect(context.res.status).toBe(204);
  });

  it('rejects non-POST methods', async () => {
    const context = createContext();
    await indexFindings(context, { method: 'GET' });
    expect(context.res.status).toBe(405);
  });

  it('rejects missing authorization', async () => {
    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: {},
      body: {},
    });
    expect(context.res.status).toBe(401);
  });

  it('rejects missing required fields', async () => {
    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: { projectName: 'Test' }, // missing projectId and findings
    });
    expect(context.res.status).toBe(400);
  });

  it('returns 503 when search not configured', async () => {
    delete process.env.SEARCH_ENDPOINT;
    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: { projectName: 'Test', projectId: 'p1', findings: [] },
    });
    expect(context.res.status).toBe(503);
  });

  it('indexes findings successfully', async () => {
    // Mock successful index response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }] }),
    });
    // Mock search for stale docs (empty)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Coffee Analysis',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'High variation in grind size',
          status: 'analyzed',
          createdAt: Date.now(),
          context: {
            activeFilters: { Machine: ['A'] },
            cumulativeScope: 35.5,
            stats: { mean: 10.2, cpk: 0.85, samples: 50 },
          },
          comments: [],
          statusChangedAt: Date.now(),
        }],
        hypotheses: [],
      },
    });

    expect(context.res.status).toBe(200);
    expect(context.res.body.indexed).toBe(1);
  });

  it('includes tenant ID in indexed documents', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken('my-tenant')}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'Test finding',
          status: 'observed',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: null },
          comments: [],
          statusChangedAt: Date.now(),
        }],
      },
    });

    // Verify the fetch call included tenant ID in the document
    const indexCall = mockFetch.mock.calls[0];
    const body = JSON.parse(indexCall[1].body);
    expect(body.value[0].owner_tenant_id).toBe('my-tenant');
  });

  it('deletes stale documents for the project', async () => {
    // Mock successful index response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f2', status: true }] }),
    });
    // Mock search returning one stale doc (f1 no longer in findings)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ id: 'p1_f1' }, { id: 'p1_f2' }] }),
    });
    // Mock delete response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f2',
          text: 'Remaining finding',
          status: 'observed',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: null },
          comments: [],
          statusChangedAt: Date.now(),
        }],
      },
    });

    expect(context.res.status).toBe(200);
    expect(context.res.body.deleted).toBe(1);
  });

  it('resolves factor from hypothesis when hypothesisId is set', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'Finding linked to hypothesis',
          status: 'investigating',
          hypothesisId: 'h1',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: null },
          comments: [],
          statusChangedAt: Date.now(),
        }],
        hypotheses: [{
          id: 'h1',
          text: 'Machine type causes variation',
          factor: 'Machine',
        }],
      },
    });

    const indexCall = mockFetch.mock.calls[0];
    const body = JSON.parse(indexCall[1].body);
    expect(body.value[0].factor).toBe('Machine');
    expect(body.value[0].hypothesis_text).toBe('Machine type causes variation');
  });

  it('converts eta_squared from cumulativeScope percentage', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'Scope finding',
          status: 'analyzed',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: 42.0 },
          comments: [],
          statusChangedAt: Date.now(),
        }],
      },
    });

    const indexCall = mockFetch.mock.calls[0];
    const body = JSON.parse(indexCall[1].body);
    expect(body.value[0].eta_squared).toBeCloseTo(0.42);
  });

  it('maps outcome_effective to boolean correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [{ key: 'p1_f1', status: true }, { key: 'p1_f2', status: true }] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] }),
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [
          {
            id: 'f1',
            text: 'Effective fix',
            status: 'resolved',
            outcome: { effective: 'yes', cpkAfter: 1.45 },
            createdAt: Date.now(),
            context: { activeFilters: {}, cumulativeScope: null },
            comments: [],
            statusChangedAt: Date.now(),
          },
          {
            id: 'f2',
            text: 'Ineffective fix',
            status: 'resolved',
            outcome: { effective: 'no' },
            createdAt: Date.now(),
            context: { activeFilters: {}, cumulativeScope: null },
            comments: [],
            statusChangedAt: Date.now(),
          },
        ],
      },
    });

    const indexCall = mockFetch.mock.calls[0];
    const body = JSON.parse(indexCall[1].body);
    expect(body.value[0].outcome_effective).toBe(true);
    expect(body.value[0].cpk_after).toBe(1.45);
    expect(body.value[1].outcome_effective).toBe(false);
  });

  it('returns 502 when search indexing fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'Test',
          status: 'observed',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: null },
          comments: [],
          statusChangedAt: Date.now(),
        }],
      },
    });

    expect(context.res.status).toBe(502);
    expect(context.log.error).toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const context = createContext();
    await indexFindings(context, {
      method: 'POST',
      headers: { authorization: `Bearer ${createMockToken()}` },
      body: {
        projectName: 'Test',
        projectId: 'p1',
        findings: [{
          id: 'f1',
          text: 'Test',
          status: 'observed',
          createdAt: Date.now(),
          context: { activeFilters: {}, cumulativeScope: null },
          comments: [],
          statusChangedAt: Date.now(),
        }],
      },
    });

    expect(context.res.status).toBe(500);
    expect(context.log.error).toHaveBeenCalledWith('Indexing error:', 'Network failure');
  });
});
