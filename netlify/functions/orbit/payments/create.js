const { createPayment } = require('../../../../backend/services/payments-create.js');

// Mock DB for now - replace with real pg client
const db = {
  agents: {
    findById: async (id) => ({
      status: 'ACTIVE',
      behavior_score: 80,
    }),
  },
  artist_agent_permissions: {
    findByArtistAndAgent: async () => null, // No restriction
    countByDay: async () => 0,
    countGlobalByDay: async () => 0,
    findLastByAgentAndArtist: async () => null,
  },
  payments: {
    countByArtistToday: async () => 0,
    countGlobalToday: async () => 0,
    findLastByAgentAndArtist: async () => null,
  },
  pending_payments: {
    countByArtistToday: async () => 0,
    insert: async (data) => console.log('[DB] Insert pending_payment:', data.id),
    updateStatus: async () => {},
  },
};

// JWT verification stub (integrate with real JWT service)
function verifyJWT(token) {
  if (!token) return null;
  // Allow test tokens
  if (token === 'valid.jwt.token' || token === 'test-jwt-token') {
    return { agentId: 'agent_123' };
  }
  // Decode base64 (no signature verification for demo)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return { agentId: payload.agentId };
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: getCorsHeaders(event) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Parse body
    const body = JSON.parse(event.body);
    const { agentId, artistId, amount, currency, jwtToken } = body;

    // Extract agent from JWT
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const decoded = verifyJWT(authHeader?.replace('Bearer ', ''));
    if (!decoded) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    const effectiveAgentId = decoded.agentId;

    // Validate input
    if (!artistId || !amount || !currency) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (!['EUR', 'USDC'].includes(currency)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid currency' }) };
    }

    if (amount <= 0 || amount > 1000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    // Create payment
    const result = await createPayment(
      {
        agentId: effectiveAgentId,
        artistId,
        amount,
        currency,
        jwtToken: event.headers.authorization,
      },
      db
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[PaymentCreate] Error:', error.message);

    // Map validation errors to appropriate status codes
    if (error.message.includes('Validation failed')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message.split(': ')[1] || 'Validation failed' }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function getCorsHeaders(event) {
  const origin = event.headers.origin || 'http://localhost:3000';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}
