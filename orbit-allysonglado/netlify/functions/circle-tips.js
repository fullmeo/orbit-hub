/**
 * ORBIT Circle Tipping API - Netlify Function
 * Creates USDC payment requests via Circle API (Sandbox)
 */

exports.config = { provider: 'esbuild' };

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_API_URL = process.env.CIRCLE_API_URL || 'https://api.sandbox.circle.com';
const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID;
const USDC_AMOUNT_SMALL = '5'; // 5 USDC
const USDC_AMOUNT_LARGE = '10'; // 10 USDC

function isOriginAllowed(event) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const hostname = event.headers.host || '';
  const origin = event.headers.origin || `https://${hostname}`;

  if (!allowedOrigin) return true;
  if (origin === allowedOrigin) return true;
  if (hostname.includes('--orbit-allysonglado.netlify.app')) return true;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return true;
  return false;
}

function getCorsHeaders(event) {
  const hostname = event.headers.host || '';
  if (hostname.includes('--') || hostname.includes('localhost')) {
    return {
      'Access-Control-Allow-Origin': `https://${hostname}`,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function createPaymentIntent(amount, idempotencyKey) {
  try {
    // Circle API: Create Payment Intent
    const response = await fetch(`${CIRCLE_API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: {
          amount: amount,
          currency: 'USD',
        },
        idempotencyKey,
        description: `Tip for Allyson Glado - ${amount} USDC`,
        metadata: {
          artist: 'Allyson Glado',
          type: 'fan_tip',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Circle API] Error:', response.status, error);
      throw new Error(`Circle API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Circle] Payment Intent created:', data.data?.id);

    return {
      success: true,
      paymentId: data.data?.id,
      amount: amount,
      status: data.data?.status,
      metadata: data.data?.metadata,
    };
  } catch (error) {
    console.error('[Circle] Payment creation failed:', error.message);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] Circle Tips - ${event.httpMethod} request`);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: '',
    };
  }

  try {
    if (!isOriginAllowed(event)) {
      return {
        statusCode: 403,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'CORS: Origin not allowed' }),
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!CIRCLE_API_KEY || !CIRCLE_WALLET_ID) {
      console.error('[Circle] Missing API key or wallet ID');
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Server misconfigured' }),
      };
    }

    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'Invalid JSON' }),
        };
      }
    }

    const { action, amount } = body;
    const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';

    if (action === 'create') {
      // Validate amount
      let tipAmount;
      if (amount === 'small') {
        tipAmount = USDC_AMOUNT_SMALL;
      } else if (amount === 'large') {
        tipAmount = USDC_AMOUNT_LARGE;
      } else if (typeof amount === 'string' && /^\d+(\.\d{1,2})?$/.test(amount)) {
        tipAmount = amount; // Allow custom amounts
      } else {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'Invalid amount' }),
        };
      }

      // Create idempotency key (prevent duplicate charges)
      const idempotencyKey = `${clientIp}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        const result = await createPaymentIntent(tipAmount, idempotencyKey);

        return {
          statusCode: 200,
          headers: {
            ...getCorsHeaders(event),
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
          body: JSON.stringify({
            success: true,
            paymentId: result.paymentId,
            amount: result.amount,
            currency: 'USDC',
            status: result.status,
            message: `Payment request created for ${tipAmount} USDC`,
          }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            error: 'Failed to create payment',
            details: error.message,
          }),
        };
      }
    } else if (action === 'check-status') {
      // Check status of a payment (for polling)
      const { paymentId } = body;
      if (!paymentId) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'paymentId required' }),
        };
      }

      try {
        const response = await fetch(`${CIRCLE_API_URL}/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Circle API error: ${response.status}`);
        }

        const data = await response.json();
        return {
          statusCode: 200,
          headers: {
            ...getCorsHeaders(event),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: true,
            status: data.data?.status,
            amount: data.data?.amount,
            confirmed: data.data?.status === 'confirmed',
          }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ error: 'Failed to check payment status' }),
        };
      }
    } else {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }
  } catch (error) {
    console.error('[Unhandled Error]', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
