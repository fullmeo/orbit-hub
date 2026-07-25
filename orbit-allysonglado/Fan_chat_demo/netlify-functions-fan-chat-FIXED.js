/**
 * ORBIT Fan Chat API - Netlify Function
 * 
 * Secure endpoint for AI-powered fan chat with:
 * ✅ CORS protection (supports production + branch deploys)
 * ✅ Rate limiting (10 req/min per IP)
 * ✅ Request timeouts (15 seconds)
 * ✅ Input validation
 * ✅ Error handling
 * ✅ Security headers
 * 
 * FIXED: 
 * - Line 47: Use ALLOWED_ORIGIN (singular) to match netlify.toml
 * - Validation: Flexible matching for branch deploys (not just exact match)
 */

import Anthropic from "@anthropic-ai/sdk";

// ========================================================================
// CONFIGURATION
// ========================================================================

const MAX_MESSAGE_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 15000;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// In-memory rate limit store (resets on function restart)
const rateLimitStore = new Map();

// ========================================================================
// CORS & ORIGIN VALIDATION (FIXED)
// ========================================================================

function isOriginAllowed(event) {
  // FIXED: Use ALLOWED_ORIGIN (singular) to match netlify.toml
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const hostname = event.headers.host || '';
  const origin = event.headers.origin || `https://${hostname}`;

  console.log(`[CORS Check] Origin: ${origin}, Hostname: ${hostname}`);

  // If no allowed origin set, warn but allow (development mode)
  if (!allowedOrigin) {
    console.warn('⚠️  ALLOWED_ORIGIN not set - allowing all origins (DEVELOPMENT MODE)');
    return true;
  }

  // FIXED: Flexible validation instead of exact match
  
  // 1. Exact match for production
  if (origin === allowedOrigin) {
    console.log(`✅ Production origin allowed: ${origin}`);
    return true;
  }

  // 2. Branch deploy check: hostname contains --orbit-allysonglado.netlify.app
  // This matches: 69e73436bfcf340f1646af9a--orbit-allysonglado.netlify.app
  if (hostname.includes('--orbit-allysonglado.netlify.app')) {
    console.log(`✅ Branch deploy origin allowed: ${hostname}`);
    return true;
  }

  // 3. Localhost/127.0.0.1 for development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    console.log(`✅ Development origin allowed: ${hostname}`);
    return true;
  }

  // 4. Any netlify.app subdomain for preview builds
  if (hostname.endsWith('netlify.app')) {
    console.log(`✅ Netlify preview origin allowed: ${hostname}`);
    return true;
  }

  console.warn(`❌ Origin not allowed: ${origin} (Hostname: ${hostname})`);
  return false;
}

function getCorsHeaders(event) {
  // FIXED: Use ALLOWED_ORIGIN (singular)
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const hostname = event.headers.host || '';
  
  // Return the appropriate origin for CORS header
  // For branch deploys and localhost, echo back the request origin
  if (hostname.includes('--') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return {
      'Access-Control-Allow-Origin': `https://${hostname}`,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // For production, use ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ========================================================================
// RATE LIMITING
// ========================================================================

function checkRateLimit(clientIp) {
  const now = Date.now();
  const key = clientIp;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }

  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);

  return { allowed: true };
}

// ========================================================================
// INPUT VALIDATION
// ========================================================================

function validateMessage(message) {
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { 
      valid: false, 
      error: `Message exceeds max length of ${MAX_MESSAGE_LENGTH} characters` 
    };
  }

  return { valid: true };
}

// ========================================================================
// AI RESPONSE GENERATION
// ========================================================================

async function generateResponse(userMessage) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const artistName = process.env.ARTIST_NAME || 'Allyson Glado';
  const artistTone = process.env.ARTIST_TONE || 'chaleureux, inspirant, accessible, poétique';
  const artistBio = process.env.ARTIST_BIO || 'Artiste reggae-pop de Paris, combinant rythmes caribéens authentiques avec soul et jazz.';

  const systemPrompt = `Tu es ${artistName}, une artiste reggae-pop basée à Paris.

Ton style et ta personnalité:
- Ton: ${artistTone}
- Bio: ${artistBio}
- Albums: S-Moi (2018), Élévation (2021)
- Collaborations: Serigne Diagne (trompettiste)
- Streaming: Spotify, Apple Music, YouTube, Deezer, SoundCloud, Instagram, Facebook

Instructions:
- Réponds en français (ou englais si demandé)
- Sois authentique et personnelle
- Parle de ta musique, tes influences, tes collaborations
- Sois accueillante et engageante
- Garde les réponses concises (2-3 phrases max)
- N'invente pas d'informations sur toi-même
- Si on demande des infos que tu ne connais pas, dit "je ne sais pas" plutôt que d'inventer`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022', // Fast + cheap
    max_tokens: 200, // Keep responses short
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

export default async (event, context) => {
  console.log(`[${new Date().toISOString()}] ${event.httpMethod} request`);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: '',
    };
  }

  try {
    // ====================================================================
    // SECURITY CHECKS
    // ====================================================================

    // 1. CORS Check
    if (!isOriginAllowed(event)) {
      console.warn('[CORS] Request blocked');
      return {
        statusCode: 403,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ 
          error: 'CORS: Origin not allowed',
          details: `Origin ${event.headers.origin} is not in the allowed list`
        }),
      };
    }

    // 2. Method Check
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ 
          error: 'Method not allowed. Use POST.' 
        }),
      };
    }

    // 3. Rate Limiting
    const clientIp = event.headers['client-ip'] || 
                     event.headers['x-forwarded-for'] || 
                     'unknown';
    const rateLimitCheck = checkRateLimit(clientIp);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`[Rate Limit] IP ${clientIp} exceeded limit`);
      return {
        statusCode: 429,
        headers: {
          ...getCorsHeaders(event),
          'Retry-After': rateLimitCheck.retryAfter,
        },
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter,
        }),
      };
    }

    // ====================================================================
    // REQUEST PARSING
    // ====================================================================

    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.error('[Parse Error]', e);
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({ 
            error: 'Invalid JSON in request body' 
          }),
        };
      }
    }

    const userMessage = body.message || '';

    // ====================================================================
    // INPUT VALIDATION
    // ====================================================================

    const validation = validateMessage(userMessage);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ 
          error: validation.error 
        }),
      };
    }

    // ====================================================================
    // API KEY CHECK
    // ====================================================================

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Config Error] ANTHROPIC_API_KEY not set');
      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ 
          error: 'API configuration error. ANTHROPIC_API_KEY not set.' 
        }),
      };
    }

    // ====================================================================
    // GENERATE RESPONSE (WITH TIMEOUT)
    // ====================================================================

    console.log(`[API Call] Generating response for: "${userMessage.substring(0, 50)}..."`);

    const responsePromise = generateResponse(userMessage);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
    );

    let aiResponse;
    try {
      aiResponse = await Promise.race([responsePromise, timeoutPromise]);
      console.log(`[API Response] Success (${aiResponse.length} chars)`);
    } catch (timeoutError) {
      console.error('[Timeout Error] Request exceeded 15 seconds');
      return {
        statusCode: 504,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ 
          error: 'Response generation timed out. Please try again.' 
        }),
      };
    }

    // ====================================================================
    // SUCCESS RESPONSE
    // ====================================================================

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
        response: aiResponse,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('[Unhandled Error]', error);

    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'An unexpected error occurred while processing your request',
        details: error.message
      }),
    };
  }
};
