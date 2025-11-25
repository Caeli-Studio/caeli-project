import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = (): any => {
  const mockClient = {
    auth: {
      signInWithOAuth: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      admin: {
        signOut: vi.fn(),
      },
    },
    from: vi.fn(() => mockClient),
    select: vi.fn(() => mockClient),
    insert: vi.fn(() => mockClient),
    update: vi.fn(() => mockClient),
    delete: vi.fn(() => mockClient),
    eq: vi.fn(() => mockClient),
    neq: vi.fn(() => mockClient),
    gt: vi.fn(() => mockClient),
    gte: vi.fn(() => mockClient),
    lt: vi.fn(() => mockClient),
    lte: vi.fn(() => mockClient),
    like: vi.fn(() => mockClient),
    ilike: vi.fn(() => mockClient),
    is: vi.fn(() => mockClient),
    in: vi.fn(() => mockClient),
    contains: vi.fn(() => mockClient),
    containedBy: vi.fn(() => mockClient),
    rangeGt: vi.fn(() => mockClient),
    rangeGte: vi.fn(() => mockClient),
    rangeLt: vi.fn(() => mockClient),
    rangeLte: vi.fn(() => mockClient),
    rangeAdjacent: vi.fn(() => mockClient),
    overlaps: vi.fn(() => mockClient),
    textSearch: vi.fn(() => mockClient),
    match: vi.fn(() => mockClient),
    not: vi.fn(() => mockClient),
    or: vi.fn(() => mockClient),
    filter: vi.fn(() => mockClient),
    order: vi.fn(() => mockClient),
    limit: vi.fn(() => mockClient),
    range: vi.fn(() => mockClient),
    abortSignal: vi.fn(() => mockClient),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    geojson: vi.fn(),
    explain: vi.fn(),
    rollback: vi.fn(),
    returns: vi.fn(() => mockClient),
  };

  return mockClient;
};

/**
 * Mock successful auth response
 */
export const mockAuthSuccess = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
  },
  error: null,
};

/**
 * Mock OAuth URL response
 */
export const mockOAuthUrl = {
  data: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
    provider: 'google',
  },
  error: null,
};

/**
 * Create mock JWT token for testing
 */
export const createMockJWT = (userId = 'test-user-id') => {
  const payload = {
    sub: userId,
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  // Simple base64 encoding for testing (not secure, only for tests)
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${body}.mock-signature`;
};
