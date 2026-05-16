// ========================================================================
// BREVO Email Subscription Endpoint
// Adds email to Brevo contact list + triggers welcome automation
// ========================================================================

const RATE_LIMIT_STORE = new Map();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

/**
 * Rate limiting by IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;

  if (!RATE_LIMIT_STORE.has(key)) {
    RATE_LIMIT_STORE.set(key, 1);
    return true;
  }

  const count = RATE_LIMIT_STORE.get(key);
  if (count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  RATE_LIMIT_STORE.set(key, count + 1);
  return true;
}

/**
 * Get client IP from request headers
 */
function getClientIp(headers) {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers['client-ip'] || 'unknown';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const clientIp = getClientIp(event.headers);

    // Rate limiting check
    if (!checkRateLimit(clientIp)) {
      console.warn(`[brevo-subscribe] Rate limit exceeded for IP: ${clientIp}`);
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Too many requests. Try again later.' })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { email, source } = body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    if (!source || typeof source !== 'string' || source.length > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid source' })
      };
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoListId = process.env.BREVO_LIST_ID;

    if (!brevoApiKey || !brevoListId) {
      console.error('[brevo-subscribe] Missing Brevo configuration');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Call Brevo API: Add contact to list
    // Documentation: https://developers.brevo.com/reference/create-contact
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(brevoListId)],
        attributes: {
          SIGNUP_SOURCE: source,
          SIGNUP_DATE: new Date().toISOString()
        },
        // Trigger welcome automation if configured
        emailBlacklisted: false,
        smsBlacklisted: false
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error(`[brevo-subscribe] Brevo API error: ${brevoResponse.status}`, errorText);

      // Handle duplicate email (already in list)
      if (brevoResponse.status === 400 && errorText.includes('already exists')) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Already subscribed',
            detail: 'This email is already in our mailing list.'
          })
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to subscribe. Please try again.' })
      };
    }

    const result = await brevoResponse.json();
    console.log(`[brevo-subscribe] Successfully added ${email} from ${source}`, result);

    // Log conversion event for attribution
    if (process.env.NETLIFY_FUNCTION_PATH === '/.netlify/functions/track-conversion') {
      // Optional: call track-conversion function for analytics
      // This is non-blocking, so we don't await it
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Successfully subscribed',
        detail: 'Check your email for confirmation!'
      })
    };

  } catch (error) {
    console.error('[brevo-subscribe] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An unexpected error occurred' })
    };
  }
};
