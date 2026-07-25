// ORBIT 2.0 - Payment Status Service
// Polls Circle for payment status and updates DB

async function getPaymentStatus(paymentId, agentId, db) {
  // STEP 1: Fetch payment from DB
  const payment = await db.pending_payments.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Verify agent ownership
  if (payment.agent_id !== agentId) {
    throw new Error('Unauthorized');
  }

  // Check if already completed
  if (payment.status === 'completed') {
    return {
      paymentId,
      status: 'completed',
      walletAddress: payment.wallet_address,
      amountUSDC: payment.amount_usdc,
      transactionHash: payment.transaction_hash,
      artistReceived: payment.amount_usdc * 0.9,
      platformFee: payment.amount_usdc * 0.1,
      completedAt: payment.completed_at,
    };
  }

  // Check if expired
  if (new Date(payment.expires_at) < new Date()) {
    await db.pending_payments.updateStatus(paymentId, 'expired');
    return {
      paymentId,
      status: 'expired',
      walletAddress: '',
      amountUSDC: payment.amount_usdc,
    };
  }

  // STEP 2: Query Circle API for real-time status
  try {
    const circleStatus = await getCirclePaymentStatus(payment.circle_payment_id);

    if (circleStatus.status === 'CONFIRMED' || circleStatus.status === 'COMPLETED') {
      await db.pending_payments.updateStatus(paymentId, 'completed', {
        transaction_hash: circleStatus.transactionHash,
        completed_at: new Date().toISOString(),
      });

      // Record in agent_query_log
      await db.agent_query_log.insert({
        agent_id: agentId,
        artist_id: payment.artist_id,
        query_type: 'tip',
        cost_usdc: payment.amount_usdc,
        artist_received_usdc: payment.amount_usdc * 0.9,
        platform_fee_usdc: payment.amount_usdc * 0.1,
        x402_transaction_hash: circleStatus.transactionHash,
        query_timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - new Date(payment.created_at).getTime(),
        status: 'completed',
      });

      logAuditTrail({
        action: 'PAYMENT_COMPLETED',
        agentId,
        artistId: payment.artist_id,
        amount: payment.amount_usdc,
        timestamp: Date.now(),
        signature: hash({ agentId, artistId: payment.artist_id, amount: payment.amount_usdc }),
      });

      return {
        paymentId,
        status: 'completed',
        walletAddress: payment.wallet_address,
        amountUSDC: payment.amount_usdc,
        transactionHash: circleStatus.transactionHash,
        artistReceived: payment.amount_usdc * 0.9,
        platformFee: payment.amount_usdc * 0.1,
        completedAt: payment.completed_at,
      };
    }

    return {
      paymentId,
      status: 'pending',
      walletAddress: payment.wallet_address,
      amountUSDC: payment.amount_usdc,
    };
  } catch (error) {
    console.error('[PaymentStatus] Circle API error:', error);
    return {
      paymentId,
      status: payment.status,
      walletAddress: payment.wallet_address,
      amountUSDC: payment.amount_usdc,
    };
  }
}

async function getCirclePaymentStatus(paymentId) {
  const response = await fetch(`https://api.sandbox.circle.com/v1/payments/payment-intents/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Circle status check failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    status: data.status,
    transactionHash: data.transactionHash,
  };
}

function logAuditTrail(data) {
  console.log(`[Audit] ${data.action}`);
}

function hash(data) {
  return `${data.agentId}_${data.artistId}_${data.amount}_${Date.now()}`;
}

module.exports = { getPaymentStatus };
