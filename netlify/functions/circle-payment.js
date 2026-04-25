/**
 * Circle Payment Processing Function
 * Handles USDC payments and wallet management for Allyson
 */

exports.config = { provider: 'esbuild' };

const CIRCLE_API_BASE = 'https://api.circle.com/v1';
const USDC_TOKEN_ID = 'usdc'; // Circle's USDC identifier

async function circleRequest(endpoint, method = 'GET', body = null) {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) throw new Error('CIRCLE_API_KEY not set');

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${CIRCLE_API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    console.error('[Circle API Error]', data);
    throw new Error(data.message || `Circle API error: ${response.status}`);
  }

  return data;
}

async function ensureArtistWallet() {
  try {
    const walletId = process.env.CIRCLE_WALLET_ID;
    if (walletId) {
      console.log('[Wallet] Using existing wallet:', walletId);
      return walletId;
    }

    console.log('[Wallet] Creating new artist wallet...');
    const response = await circleRequest('/wallets', 'POST', {
      idempotencyKey: `allyson-wallet-${Date.now()}`,
      description: 'Allyson Glado - Artist Tips Wallet',
      blockchains: ['MATIC', 'SOL', 'ETH'],
    });

    const newWalletId = response.data.walletId;
    console.log('[Wallet] Created wallet:', newWalletId);

    // Note: You'll need to set CIRCLE_WALLET_ID in Netlify after this
    return newWalletId;
  } catch (error) {
    console.error('[Wallet Error]', error.message);
    throw error;
  }
}

async function getOrCreatePaymentIntent(amountUsd, fanEmail, fanName) {
  try {
    const response = await circleRequest('/payments/intents', 'POST', {
      idempotencyKey: `payment-${fanEmail}-${Date.now()}`,
      amount: {
        amount: amountUsd.toString(),
        currency: 'USD',
      },
      paymentMethods: [
        {
          type: 'ach',
        },
        {
          type: 'card',
        },
        {
          type: 'wire',
        },
      ],
      metadata: {
        fanEmail,
        fanName,
        type: 'tip',
      },
      verification: {
        type: 'cvv',
      },
    });

    return {
      clientToken: response.data.clientToken,
      intentId: response.data.id,
    };
  } catch (error) {
    console.error('[Payment Intent Error]', error.message);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] Circle Payment Request`);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    let body = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }

    const { amount, fanEmail, fanName, type } = body;

    if (!amount || !fanEmail || !fanName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: amount, fanEmail, fanName',
        }),
      };
    }

    if (amount <= 0 || amount > 10000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Amount must be between 0.01 and 10000 USD',
        }),
      };
    }

    // Ensure artist wallet exists
    const walletId = await ensureArtistWallet();

    // Create payment intent
    const { clientToken, intentId } = await getOrCreatePaymentIntent(
      amount,
      fanEmail,
      fanName
    );

    console.log('[Payment] Intent created:', intentId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        clientToken,
        intentId,
        walletId,
        message: `Payment intent created for $${amount} USD`,
      }),
    };
  } catch (error) {
    console.error('[Unhandled Error]', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Payment processing failed',
        details: error.message,
      }),
    };
  }
};
