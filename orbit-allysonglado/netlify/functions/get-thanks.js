/**
 * ORBIT Get Thank You Message - Netlify Function
 * Returns AI-generated thank you message for a payment
 */

exports.config = { provider: 'esbuild' };

// Import the webhook handler to access stored messages
// In production, this should be a shared database
const circleWebhook = require('./circle-webhook.js');

function getCorsHeaders(event) {
  const hostname = event.headers.host || '';
  if (hostname.includes('--') || hostname.includes('localhost')) {
    return {
      'Access-Control-Allow-Origin': `https://${hostname}`,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] Get Thanks - ${event.httpMethod}`);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Extract paymentId from query string
    const paymentId = event.queryStringParameters?.paymentId;

    if (!paymentId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'paymentId query parameter required' }),
      };
    }

    // Look up the thank you message
    const messageData = circleWebhook.thankYouMessages?.get(paymentId);

    if (!messageData) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          found: false,
          message: 'Thank you message not found (may not be processed yet)',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...getCorsHeaders(event),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        success: true,
        found: true,
        message: messageData.message,
        amount: messageData.amount,
        fanName: messageData.fanName,
        timestamp: messageData.timestamp,
      }),
    };
  } catch (error) {
    console.error('[Unhandled Error]', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
