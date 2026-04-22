/**
 * ORBIT Fan Chat API - Netlify Function
 * Secure endpoint with streaming (SSE) support
 */

const Anthropic = require("@anthropic-ai/sdk");
const { PassThrough } = require("stream");
exports.config = { provider: 'esbuild' };

const MAX_MESSAGE_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds for Claude response
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitStore = new Map();

// Escalation detection
const ESCALATION_KEYWORDS = [
  'rencontr', 'backstage', 'collabor', 'booking', 'événement',
  'mariage', 'merchandise', 'boutique', 'contact direct',
  'phone', 'appel', 'whatsapp', 'instagram dm', 'direct message'
];

function shouldEscalate(message) {
  const msg = message.toLowerCase();
  return ESCALATION_KEYWORDS.some(keyword => msg.includes(keyword));
}

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
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const hostname = event.headers.host || '';
  if (hostname.includes('--') || hostname.includes('localhost')) {
    return { 'Access-Control-Allow-Origin': `https://${hostname}`, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  }
  return { 'Access-Control-Allow-Origin': allowedOrigin || '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function checkRateLimit(clientIp) {
  const now = Date.now();
  const key = clientIp;
  if (!rateLimitStore.has(key)) rateLimitStore.set(key, []);
  const requests = rateLimitStore.get(key);
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return { allowed: false, retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);
  return { allowed: true };
}

function validateMessage(message) {
  if (typeof message !== 'string') return { valid: false, error: 'Message must be a string' };
  if (message.trim().length === 0) return { valid: false, error: 'Message cannot be empty' };
  if (message.length > MAX_MESSAGE_LENGTH) return { valid: false, error: `Message exceeds max length of ${MAX_MESSAGE_LENGTH} characters` };
  return { valid: true };
}

async function sendEscalationEmail(fanMessage, fanEmail) {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.warn('[Email] BREVO_API_KEY not set, skipping email notification');
      return;
    }

    const allysonEmail = 'bovemmusique@gmail.com';
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'ORBIT Chat', email: 'noreply@orbit-allysonglado.netlify.app' },
        to: [{ email: allysonEmail, name: 'Allyson' }],
        subject: '🎤 Message spécial d\'un fan - Escalade Chat',
        htmlContent: `
          <h2>📩 Message d'un fan</h2>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f5f5f5; padding: 12px; border-left: 4px solid #667eea;">
            "${fanMessage}"
          </blockquote>
          <p><strong>Email du fan:</strong> ${fanEmail || '(Non fourni)'}</p>
          <p style="color: #666; font-size: 12px;">Timestamp: ${new Date().toLocaleString('fr-FR')}</p>
        `
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Brevo error:', error);
    } else {
      console.log('[Email] Escalation sent to Allyson');
    }
  } catch (error) {
    console.error('[Email] Failed to send escalation:', error.message);
  }
}

function getSystemPrompt() {
  const artistName = process.env.ARTIST_NAME || 'Allyson Glado';
  const artistTone = process.env.ARTIST_TONE || 'chaleureux, inspirant, accessible, poétique';
  const artistBio = process.env.ARTIST_BIO || 'Artiste reggae-pop de Paris, combinant rythmes caribéens authentiques avec soul et jazz.';
  return `Tu es ${artistName}, une artiste reggae-pop basée à Paris.

Ton style et ta personnalité:
- Ton: ${artistTone}
- Bio: ${artistBio}
- Albums: S-Moi (2018), Élévation (2021)
- Collaborations: Serigne Diagne (trompettiste)
- Streaming: Spotify, Apple Music, YouTube, Deezer, SoundCloud, Instagram, Facebook

Instructions:
- Réponds en français (ou anglais si demandé)
- Sois authentique et personnelle
- Parle de ta musique, tes influences, tes collaborations
- Sois accueillante et engageante
- Garde les réponses concises (2-3 phrases max)
- N'invente pas d'informations sur toi-même
- Si on demande des infos que tu ne connais pas, dis "je ne sais pas" plutôt que d'inventer`;
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] ${event.httpMethod} request`);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: getCorsHeaders(event), body: '' };

  try {
    if (!isOriginAllowed(event)) return { statusCode: 403, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'CORS: Origin not allowed' }) };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'Method not allowed' }) };

    const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) return { statusCode: 429, headers: { ...getCorsHeaders(event), 'Retry-After': rateLimitCheck.retryAfter }, body: JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitCheck.retryAfter }) };

    let body = {};
    if (event.body) try { body = JSON.parse(event.body); } catch (e) { return { statusCode: 400, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const userMessage = body.message || '';
    const fanEmail = body.email || null;
    const validation = validateMessage(userMessage);
    if (!validation.valid) return { statusCode: 400, headers: getCorsHeaders(event), body: JSON.stringify({ error: validation.error }) };

    if (!process.env.ANTHROPIC_API_KEY) return { statusCode: 500, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) };

    // Check for escalation
    if (shouldEscalate(userMessage)) {
      console.log('[Escalation] Message escalated:', userMessage.substring(0, 100));
      await sendEscalationEmail(userMessage, fanEmail);
      return {
        statusCode: 200,
        headers: { ...getCorsHeaders(event), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalated: true,
          reply: fanEmail
            ? "C'est une demande spéciale! 🎉 J'envoie ça à Allyson, elle te répondra à ton email très bientôt 💫"
            : "C'est une demande spéciale! 🎉 J'envoie ça à Allyson. Pour qu'elle puisse te répondre, partage-moi ton email 💌"
        })
      };
    }

    const shouldStream = event.queryStringParameters?.stream === 'true';
    console.log(`[API] Mode: ${shouldStream ? 'STREAMING' : 'JSON'}, Query:`, event.queryStringParameters);

    if (shouldStream) {
      // STREAMING MODE (SSE)
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const systemPrompt = getSystemPrompt();
      const stream = new PassThrough();

      let aborted = false;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { aborted = true; controller.abort(); }, REQUEST_TIMEOUT_MS);

      (async () => {
        try {
          console.log('[Anthropic] Starting stream request...');
          const anthropicStream = await client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 200,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            stream: true,
            signal: controller.signal,
          });

          console.log('[Anthropic] Stream established, reading events...');
          let tokenCount = 0;

          for await (const eventItem of anthropicStream) {
            if (eventItem.type === 'content_block_delta') {
              const text = eventItem.delta?.text || '';
              if (text && !aborted) {
                tokenCount++;
                stream.write(`data: ${text}\n\n`);
              }
            } else if (eventItem.type === 'message_stop') {
              console.log(`[Anthropic] Stream complete (${tokenCount} tokens)`);
            }
          }

          if (!aborted) {
            stream.write('event: done\ndata: [DONE]\n\n');
            stream.end();
          }
        } catch (err) {
          console.error('[Anthropic Stream Error]', err.message, err.stack);
          if (!aborted) {
            stream.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
            stream.end();
          }
        } finally {
          clearTimeout(timeoutId);
        }
      })();

      return {
        statusCode: 200,
        headers: {
          ...getCorsHeaders(event),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Connection': 'keep-alive',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
        body: stream,
      };

    } else {
      // NON-STREAMING MODE (JSON)
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const systemPrompt = getSystemPrompt();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS));

      try {
        const response = await Promise.race([
          client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 200,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          }),
          timeoutPromise,
        ]);

        const reply = response.content[0].type === 'text' ? response.content[0].text : '';
        return { statusCode: 200, headers: { ...getCorsHeaders(event), 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' }, body: JSON.stringify({ success: true, reply: reply, timestamp: new Date().toISOString() }) };
      } catch (err) {
        if (err.message === 'Request timeout') return { statusCode: 504, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'Response generation timed out.' }) };
        throw err;
      }
    }

  } catch (error) {
    console.error('[Unhandled Error]', error);
    return { statusCode: 500, headers: getCorsHeaders(event), body: JSON.stringify({ error: 'Internal server error', details: error.message }) };
  }
};
