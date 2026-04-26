

// netlify/functions/circle-webhook.js
// Reçoit les webhooks Circle (transactions entrantes)
// Quand un tip USDC arrive → appelle l'API IA pour générer un remerciement
// et le stocke pour que le widget le montre au fan

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ARTIST_NAME = process.env.ARTIST_NAME || "Orbit-Hub Artist";
const ARTIST_LAST_SINGLE =
  process.env.ARTIST_LAST_SINGLE_URL || "https://open.spotify.com/track/XXXXX";
const ARTIST_MERCH_URL =
  process.env.ARTIST_MERCH_URL || "https://orbit-hub.example.com/merch";
const ARTIST_TONE =
  process.env.ARTIST_TONE || "chaleureux, poétique, proche des fans";

// Pour stocker les remerciements en mémoire courte (en prod, utiliser Redis/DB)
// Netlify Functions sont stateless, donc on utilise un fichier JSON sur disque
// ou on notifie via broadcastChannel / WebSocket
// Pour cette v1 : on écrit dans un fichier que le widget peut lire
const THANKS_FILE = "/tmp/circle-thanks.json";

const fs = require("fs");
const path = require("path");

function json(code, body) {
  return {
    statusCode: code,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

// ─── Sauvegarde le remerciement dans un fichier partagé ───
function saveThank(msg) {
  try {
    let all = [];
    if (fs.existsSync(THANKS_FILE)) {
      all = JSON.parse(fs.readFileSync(THANKS_FILE, "utf8"));
    }
    all.push({ ...msg, ts: Date.now() });
    // Garder seulement les 50 derniers
    if (all.length > 50) all = all.slice(-50);
    fs.writeFileSync(THANKS_FILE, JSON.stringify(all, null, 2));
  } catch (e) {
    console.error("saveThank error:", e);
  }
}

// ─── Appelle Anthropic pour générer le remerciement ───
async function generateThankYou(amount, tipperName) {
  if (!ANTHROPIC_API_KEY) {
    return `Merci pour ton tip de ${amount} USDC ! 🎵💫`;
  }

  const systemPrompt = `
Tu es ${ARTIST_NAME}. Un fan vient de t'envoyer un tip en USDC.
Génère un message de remerciement personnalisé, chaleureux et poétique.
Style : ${ARTIST_TONE}.
- Si tu connais le nom du fan (${tipperName}), utilise-le
- Mentionne le montant (${amount} USDC)
- Inclut un lien vers ton dernier single : ${ARTIST_LAST_SINGLE}
- Si le montant >= 10, mentionne aussi le merch : ${ARTIST_MERCH_URL}
- 3-4 phrases max, avec emoji
- Répond en français
`;

  try {
[25/04/2026 01:56] KiloClawMagnus: const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 250,
        temperature: 0.9,
        system: systemPrompt,
        messages: [{ role: "user", content: "Génère le message de remerciement" }],
      }),
    });
    const data = await res.json();
    return (
      data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") ||
      `Merci pour ton tip de ${amount} USDC ! 🎵`
    );
  } catch (e) {
    console.error("Anthropic error:", e);
    return `Merci pour ton tip de ${amount} USDC ! 🎵💫`;
  }
}

exports.handler = async (event) => {
  // HEAD request → Circle health check
  if (event.httpMethod === "HEAD") {
    return { statusCode: 200, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { notificationType, notification } = body;

  console.log("Webhook received:", notificationType);

  // ─── Événements qui nous intéressent ───

  // Programmable Wallets: transactions entrantes confirmées
  if (notificationType === "transactions.inbound" || notificationType === "transactions.completed") {
    const amount = notification?.amount?.amount || notification?.amount || "0";
    const token = notification?.token?.symbol || "USDC";

    if (token === "USDC" && parseFloat(amount) > 0) {
      const tipperName = notification?.metadata?.tipperName || "un fan";

      console.log(`🎵 Tip reçu: ${amount} ${token} de ${tipperName}`);

      const thankYouMsg = await generateThankYou(amount, tipperName);

      saveThank({
        type: "tip",
        amount,
        token,
        tipperName,
        message: thankYouMsg,
      });

      console.log("Remerciement généré:", thankYouMsg);
    }

    return json(200, { received: true });
  }

  // CPN: paiements complétés
  if (notificationType === "cpn.payment.completed") {
    const amount = notification?.amount?.amount || "0";
    const tipperName = notification?.metadata?.tipperName || "un fan";

    console.log(`🎵 Paiement Circle complété: ${amount} USDC`);

    const thankYouMsg = await generateThankYou(amount, tipperName);

    saveThank({
      type: "tip",
      amount,
      token: "USDC",
      tipperName,
      message: thankYouMsg,
    });

    return json(200, { received: true });
  }

  // Autres événements → on logue mais on ne fait rien
  console.log("Ignored webhook event:", notificationType);
  return json(200, { received: true, ignored: true });
};

───

