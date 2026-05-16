/**
 * ORBIT Circle Webhook Handler - Netlify Function
 * Receives Circle payment confirmations and triggers thank you message
 */

exports.config = { provider: 'esbuild' };

const Anthropic = require("@anthropic-ai/sdk");

// In-memory storage for thank you messages (in production, use a database)
const thankYouMessages = new Map();

function verifyCircleSignature(event) {
  // In production, verify Circle's HMAC signature
  // For now, we'll do basic validation
  const signature = event.headers['x-circle-signature'] || '';
  const circleSigKey = process.env.CIRCLE_WEBHOOK_SECRET;

  if (!circleSigKey) {
    console.warn('[Circle Webhook] No signature key configured, accepting all webhooks');
    return true;
  }

  // TODO: Implement HMAC-SHA256 verification
  return true;
}

async function generateThankYouMessage(fanName, amount) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[Claude] API key not set');
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = `Tu es Allyson Glado, artiste reggae-pop basée à Paris. Un fan vient de te donner un pourboire généreux en USDC.

Ton style: Chaleureux, authentique, poétique, inspirant, personnel.

Génère un message de remerciement court (2-3 phrases max) et très personnel:
- Commence par remercier le fan
- Mentionne le montant en USDC (c'est spécial comme geste Web3!)
- Sois poétique et authentique
- Termine par un emoji approprié

Le message doit être en français sauf si demandé autrement.`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Un fan nommé "${fanName}" vient de me donner un pourboire de ${amount} USDC. Génère un message personnel de remerciement.`,
        },
      ],
    });

    const thankYouText = response.content[0]?.text || '';
    console.log('[Claude] Thank you message generated');
    return thankYouText;
  } catch (error) {
    console.error('[Claude] Error generating message:', error.message);
    return null;
  }
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] Circle Webhook - ${event.httpMethod}`);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, body: '' };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!verifyCircleSignature(event)) {
      console.warn('[Circle] Invalid signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON' }),
        };
      }
    }

    const { notificationType, data } = body;

    // Handle payment confirmation
    if (notificationType === 'payment.confirmed') {
      const paymentId = data?.id;
      const amount = data?.amount?.amount;
      const fanName = data?.metadata?.fanName || 'Fan';

      console.log(`[Circle] Payment confirmed: ${paymentId} - ${amount} USDC from ${fanName}`);

      // Generate thank you message
      const thankYouMessage = await generateThankYouMessage(fanName, amount);

      if (thankYouMessage) {
        // Store message for retrieval
        thankYouMessages.set(paymentId, {
          message: thankYouMessage,
          timestamp: new Date().toISOString(),
          amount: amount,
          fanName: fanName,
        });

        console.log('[Webhook] Thank you message stored:', paymentId);

        // Keep only recent messages (last 100)
        if (thankYouMessages.size > 100) {
          const firstKey = thankYouMessages.keys().next().value;
          thankYouMessages.delete(firstKey);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          paymentId,
          messageGenerated: !!thankYouMessage,
        }),
      };
    }

    // Handle other webhook types
    if (notificationType === 'payment.failed') {
      console.log('[Circle] Payment failed:', data?.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Payment failure recorded' }),
      };
    }

    // Unknown notification type
    console.log('[Circle] Unknown notification type:', notificationType);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('[Unhandled Error]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Export for testing
exports.thankYouMessages = thankYouMessages;
exports.generateThankYouMessage = generateThankYouMessage;
