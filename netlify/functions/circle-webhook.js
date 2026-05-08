/**
 * MVP: Circle Webhook Handler
 * Handles payment confirmations and triggers thank you messages
 */

const Anthropic = require("@anthropic-ai/sdk");
exports.config = { provider: 'esbuild' };

async function generateThankYouMessage(fanName, amount) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return `Merci ${fanName}! 💫 Ton soutien me touche profondément. Écoute mon dernier single sur Spotify! 🎶`;
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      system: `Tu es Allyson Glado, artiste reggae-pop. Sois chaleureuse et poétique.
Messages de remerciement: courts (2 phrases), authentiques, cite ta musique.`,
      messages: [
        {
          role: 'user',
          content: `Fan "${fanName}" t'a donné $${amount}. Écris un remerciement court et personnel. Seulement le message.`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('[AI Error]', error.message);
    return `Merci ${fanName}! 💫 Ton amour m'inspire chaque jour. À bientôt! ✨`;
  }
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { fanName, fanEmail, amount, intentId } = JSON.parse(event.body || '{}');

    if (!fanName || !fanEmail || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    console.log(`[Webhook] Payment confirmed: ${fanName} → $${amount}`);

    // Generate AI thank you message
    const thankYouMessage = await generateThankYouMessage(fanName, amount);

    console.log('[Message]', thankYouMessage);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        fanEmail,
        fanName,
        amount,
        message: thankYouMessage,
      }),
    };
  } catch (error) {
    console.error('[Error]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
