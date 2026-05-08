/**
 * MVP: Circle Payment Processing
 * Simple demo version - mocks Circle API if key not available
 */

exports.config = { provider: 'esbuild' };

const USE_MOCK = !process.env.CIRCLE_API_KEY;

async function mockPaymentIntent(amount, email, name) {
  console.log('[MOCK] Creating payment intent', { amount, email, name });
  return {
    clientToken: 'mock_token_' + Date.now(),
    intentId: 'mock_intent_' + Math.random().toString(36).substr(2, 9),
  };
}

async function realPaymentIntent(amount, email, name) {
  const apiKey = process.env.CIRCLE_API_KEY;
  const response = await fetch('https://api.circle.com/v1/payments/intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: `tip-${email}-${Date.now()}`,
      amount: { amount: amount.toString(), currency: 'USD' },
      paymentMethods: [{ type: 'card' }],
      metadata: { fanEmail: email, fanName: name, type: 'tip' },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Payment API error');

  return { clientToken: data.data.clientToken, intentId: data.data.id };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { amount, fanEmail, fanName } = JSON.parse(event.body || '{}');

    if (!amount || !fanEmail || !fanName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    console.log(`[Payment] Tip $${amount} from ${fanName} (${fanEmail})`);

    let result;
    if (USE_MOCK) {
      result = await mockPaymentIntent(amount, fanEmail, fanName);
    } else {
      result = await realPaymentIntent(amount, fanEmail, fanName);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        ...result,
        isMocked: USE_MOCK,
        message: `Payment ready for $${amount}`,
      }),
    };
  } catch (error) {
    console.error('[Payment Error]', error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
