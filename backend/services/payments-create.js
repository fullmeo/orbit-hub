// ORBIT 2.0 - Payment Creation Service
// Integrates KiloClaw validation, EUR→USDC conversion, and Circle PaymentIntent

const { convertEURtoUSDC } = require('./conversion');
const { kiloClawStage1Validate } = require('./kiloClaw');

async function createPayment(input, db) {
  const { agentId, artistId, amount, currency } = input;

  if (!input.jwtToken) {
    input.jwtToken = '';
  }

  // STEP 1: KiloClaw Stage 1 Validation
  const validation = await kiloClawStage1Validate(
    agentId,
    input.jwtToken,
    artistId,
    amount,
    db
  );

  if (!validation.approved) {
    throw new Error(`Validation failed: ${validation.reason}`);
  }

  // STEP 2: Convert to USDC if needed
  let amountUSDC;
  if (currency === 'USDC') {
    amountUSDC = amount;
  } else if (currency === 'EUR') {
    amountUSDC = await convertEURtoUSDC(amount);
  } else {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // STEP 3: Create Circle PaymentIntent
  const circleResponse = await createCirclePaymentIntent({
    amount: amountUSDC,
    agentId,
    artistId,
    metadata: {
      agent_id: agentId,
      artist_id: artistId,
      original_amount: amount.toString(),
      original_currency: currency,
    },
  });

  // STEP 4: Record in pending_payments table
  const pendingId = `pending_${Date.now()}`;
  await db.pending_payments.insert({
    id: pendingId,
    agent_id: agentId,
    artist_id: artistId,
    amount_usdc: amountUSDC,
    original_amount: amount,
    original_currency: currency,
    circle_payment_id: circleResponse.id,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });

  // STEP 5: Audit log
  logAuditTrail({
    action: 'PAYMENT_CREATED',
    agentId,
    artistId,
    amount: amountUSDC,
    timestamp: Date.now(),
    signature: hash({ agentId, artistId, amount }),
  });

  return {
    paymentId: pendingId,
    walletAddress: process.env.CIRCLE_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
    amountUSDC,
    originalCurrency: currency,
    originalAmount: amount,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'PENDING',
  };
}

async function createCirclePaymentIntent(params) {
  const response = await fetch('https://api.sandbox.circle.com/v1/payments/payment-intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: {
        amount: params.amount.toFixed(2),
        currency: 'USDC',
      },
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id };
}

// Stubs
function logAuditTrail(data) {
  console.log(`[Audit] ${data.action}`);
}

function hash(data) {
  return `${data.agentId}_${data.artistId}_${data.amount}_${Date.now()}`;
}

module.exports = { createPayment };
