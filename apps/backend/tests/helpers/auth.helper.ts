import jwt from 'jsonwebtoken';

export interface TestTokenData {
  token: string;
  userId: string;
}

export async function createTestToken(): Promise<TestTokenData> {
  const testUserId = 'b41d8c1a-35ed-4699-bbed-7f045db55dd4';

  // Créer un token JWT valide pour les tests
  const payload = {
    sub: testUserId,
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  const token = jwt.sign(payload, secret);

  console.log(`✅ Token obtained: ${token.substring(0, 20)}...`);

  return {
    token,
    userId: testUserId,
  };
}
