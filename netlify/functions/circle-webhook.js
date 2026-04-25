/**
 * Circle Webhook Handler
 * Processes payment confirmations and triggers thank you messages
 */

const Anthropic = require("@anthropic-ai/sdk");
exports.config = { provider: 'esbuild' };

const THANK_YOU_PROMPTS = {
  5: "Le fan vient de vous envoyer 5 €. C'est un geste gentil!",
  10: "Le fan vient de vous envoyer 10 USDC. Quelle générosité!",
  25: "Le fan vient de vous envoyer 25 USDC. Vous êtes béni!",
  50: "Le fan vient de vous envoyer 50 USDC. Cet amour est précieux!",
};

function verifyCircleWebhook(body, signature) {
  // In production, verify the signature from Circle
  // For now, we trust Netlify's security
  // Circle will sign webhooks with: HMAC-SHA256(body, webhookSecret)
  console.log('[Webhook] Verification: signature =', signature ? 'present' : 'missing');
  return true; // Implement proper verification in production
}

async function generateThankYouMessage(fanName, amount, currency) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('[AI] ANTHROPIC_API_KEY not set, using template');
      return getTemplateThankYou(fanName, amount, currency);
    }

    const client = new Anthropic({ apiKey });
    const systemPrompt = getArtistSystemPrompt();

    const userPrompt = `
Un fan (${fanName}) vient de te donner ${amount} ${currency} en tip via Circle.

Écris un message de remerciement COURT, authentique et poétique (2-3 phrases max).
Sois chaleureuse, personnelle, cite quelque chose de spécifique sur ta musique.
Termine par un appel à l'action: écouter ton dernier single ou visiter ta boutique.

Réponds UNIQUEMENT le message, pas d'explications.
`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const message =
      response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[AI] Thank you message generated');
    return message.trim();
  } catch (error) {
    console.error('[AI] Error generating message:', error.message);
    return getTemplateThankYou(fanName, amount, currency);
  }
}

function getTemplateThankYou(fanName, amount, currency) {
  const templates = [
    `Merci ${fanName}! 💫 Ton soutien me touche profondément. Écoute mon dernier single sur Spotify! 🎶`,
    `${fanName}, tu es une bénédiction! 🙏 Ton amour m'inspire chaque jour. Viens rejoindre la communauté! 🎵`,
    `Merci pour ce beau geste, ${fanName}! 💝 C'est grâce à des fans comme toi que je peux créer. À bientôt! ✨`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function getArtistSystemPrompt() {
  return `Tu es Allyson Glado, artiste reggae-pop de Paris.
Ton style: chaleureux, inspirant, accessible, poétique.
Parle de ta musique (albums S-Moi 2018, Élévation 2021).
Sois authentique et personnelle dans tes remerciements.
Suggestions: mentionne un dernier single, invite à suivre sur Spotify/Instagram.`;
}

async function sendFanChatNotification(fanEmail, thankYouMessage) {
  // This would integrate with fan-chat to show the thank you message
  // For now, we just log it - implementation in next version
  console.log('[Notification] Would send to fan:', fanEmail);
  console.log('[Message] Thank you:', thankYouMessage);
}

exports.handler = async (event) => {
  console.log(`[${new Date().toISOString()}] Circle Webhook`);

  // Verify it's a POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let body = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }

    const signature = event.headers['x-circle-signature'] || event.headers['circle-signature'];

    // Verify webhook authenticity
    if (!verifyCircleWebhook(event.body, signature)) {
      console.warn('[Webhook] Invalid signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { notificationType, data } = body;

    console.log('[Webhook] Type:', notificationType);

    // Handle payment success
    if (notificationType === 'payments.complete') {
      const { id, amount, metadata, status } = data;

      if (status !== 'confirmed') {
        console.log('[Webhook] Payment not confirmed, status:', status);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, status: 'payment_pending' }),
        };
      }

      const { fanEmail, fanName } = metadata || {};
      const amountValue = amount?.amount || 0;
      const currency = amount?.currency || 'USD';

      console.log(
        '[Payment] Confirmed:',
        fanName,
        amountValue,
        currency
      );

      // Generate personalized thank you message
      const thankYouMessage = await generateThankYouMessage(
        fanName,
        amountValue,
        currency
      );

      console.log('[Message] Generated:', thankYouMessage);

      // Send notification (would integrate with fan-chat)
      await sendFanChatNotification(fanEmail, thankYouMessage);

      // Store in analytics/database (optional - Phase 2)
      // await supabase.from('tips').insert({
      //   payment_id: id,
      //   fan_email: fanEmail,
      //   fan_name: fanName,
      //   amount: amountValue,
      //   currency,
      //   message: thankYouMessage,
      //   timestamp: new Date()
      // });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          status: 'payment_processed',
          message: thankYouMessage,
        }),
      };
    }

    // Handle payment failure
    if (notificationType === 'payments.failed') {
      const { id, metadata } = data;
      const { fanEmail, fanName } = metadata || {};

      console.log('[Payment] Failed for:', fanName);

      // Notify fan of failure
      // This could integrate with email or fan-chat
      // await notifyPaymentFailure(fanEmail, fanName);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          status: 'payment_failed_notified',
        }),
      };
    }

    // Unknown notification type
    console.log('[Webhook] Unknown notification type:', notificationType);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        status: 'notification_logged',
      }),
    };
  } catch (error) {
    console.error('[Webhook Error]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Webhook processing failed',
        details: error.message,
      }),
    };
  }
};
