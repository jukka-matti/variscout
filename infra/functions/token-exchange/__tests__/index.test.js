/**
 * Tests for the OBO token exchange Azure Function.
 *
 * Run with: cd infra/functions && npm test
 */

// Helper: create a fake JWT with a given payload
function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-signature`;
}

const MOCK_CLIENT_ID = 'test-client-id-12345';

// Mock MSAL before requiring the function
const mockAcquireTokenOnBehalfOf = jest.fn();

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
    acquireTokenOnBehalfOf: mockAcquireTokenOnBehalfOf,
  })),
}));

// Set environment variables
process.env.CLIENT_ID = MOCK_CLIENT_ID;
process.env.CLIENT_SECRET = 'test-secret';
process.env.TENANT_ID = 'test-tenant-id';

const handler = require('../index');

function createContext() {
  return {
    res: null,
    log: { error: jest.fn() },
  };
}

describe('token-exchange function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-POST requests', async () => {
    const context = createContext();
    const req = { method: 'GET', body: {} };

    await handler(context, req);

    expect(context.res.status).toBe(405);
    expect(context.res.body.error).toBe('Method not allowed');
  });

  it('rejects missing token', async () => {
    const context = createContext();
    const req = { method: 'POST', body: {} };

    await handler(context, req);

    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toContain('Missing or invalid token');
  });

  it('rejects non-string token', async () => {
    const context = createContext();
    const req = { method: 'POST', body: { token: 12345 } };

    await handler(context, req);

    expect(context.res.status).toBe(400);
  });

  it('rejects token with wrong audience', async () => {
    const context = createContext();
    const token = makeJwt({ aud: 'wrong-app-id', sub: 'user@test.com' });
    const req = { method: 'POST', body: { token } };

    await handler(context, req);

    expect(context.res.status).toBe(403);
    expect(context.res.body.error).toBe('Token audience mismatch');
    expect(mockAcquireTokenOnBehalfOf).not.toHaveBeenCalled();
  });

  it('rejects malformed JWT (not 3 parts)', async () => {
    const context = createContext();
    const req = { method: 'POST', body: { token: 'not-a-jwt' } };

    await handler(context, req);

    expect(context.res.status).toBe(403);
    expect(context.res.body.error).toBe('Token audience mismatch');
  });

  it('exchanges valid token and returns accessToken + expiresOn', async () => {
    const expiresOn = new Date('2026-03-01T12:00:00Z');
    mockAcquireTokenOnBehalfOf.mockResolvedValueOnce({
      accessToken: 'graph-token-xyz',
      expiresOn,
    });

    const context = createContext();
    const token = makeJwt({ aud: MOCK_CLIENT_ID, sub: 'user@test.com' });
    const req = { method: 'POST', body: { token } };

    await handler(context, req);

    expect(context.res.status).toBe(200);
    expect(context.res.body.accessToken).toBe('graph-token-xyz');
    expect(context.res.body.expiresOn).toBe('2026-03-01T12:00:00.000Z');
    expect(mockAcquireTokenOnBehalfOf).toHaveBeenCalledWith({
      oboAssertion: token,
      scopes: ['https://graph.microsoft.com/Files.ReadWrite.All'],
    });
  });

  it('returns 401 when OBO exchange fails', async () => {
    mockAcquireTokenOnBehalfOf.mockRejectedValueOnce(new Error('Invalid grant'));

    const context = createContext();
    const token = makeJwt({ aud: MOCK_CLIENT_ID, sub: 'user@test.com' });
    const req = { method: 'POST', body: { token } };

    await handler(context, req);

    expect(context.res.status).toBe(401);
    expect(context.res.body.error).toContain('Token exchange failed');
    expect(context.log.error).toHaveBeenCalled();
  });

  it('handles expiresOn being undefined', async () => {
    mockAcquireTokenOnBehalfOf.mockResolvedValueOnce({
      accessToken: 'graph-token-no-expiry',
      expiresOn: undefined,
    });

    const context = createContext();
    const token = makeJwt({ aud: MOCK_CLIENT_ID, sub: 'user@test.com' });
    const req = { method: 'POST', body: { token } };

    await handler(context, req);

    expect(context.res.status).toBe(200);
    expect(context.res.body.accessToken).toBe('graph-token-no-expiry');
    expect(context.res.body.expiresOn).toBeUndefined();
  });
});
