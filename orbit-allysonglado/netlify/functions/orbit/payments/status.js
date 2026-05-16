const { getPaymentStatus } = require('../../../../backend/services/payments-status');

// Mock DB - replace with real pg client
const db = {
  pending_payments: {
    findById: async (id) => ({
      agent_id: 'agent_123',
      artist_id: 'allyson_glado',
      amount_usdc: 5.5,
      wallet_address: '0x1234567890abcdef',
      circle_payment_id: 'pi_sandbox_123',
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    }),
    updateStatus: async () => {},
  },
  agent_query_log: {
    insert: async (data) => console.log('[DB] Agent query logged:', data),
  },
};

function verifyJWT(token) {
  if (!token) return null;
  // Allow test tokens
  if (token === 'valid.jwt.token' || token === 'test-jwt-token') {
    return { agentId: 'agent_123' };
  }
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

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Extract paymentId from path
    const paymentId = event.pathParameters?.paymentId || event.queryStringParameters?.paymentId;
    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'paymentId path parameter required' }),
      };
    }

    // Verify JWT
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const decoded = verifyJWT(authHeader?.replace('Bearer ', ''));
    if (!decoded) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    const agentId = decoded.agentId;

    // Get payment status
    const result = await getPaymentStatus(paymentId, agentId, db);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[PaymentStatus] Error:', error.message);

    if (error.message === 'Payment not found') {
      return { statusCode: 404, body: JSON.stringify({ error: 'Payment not found' }) };
    }

    if (error.message === 'Unauthorized') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}
