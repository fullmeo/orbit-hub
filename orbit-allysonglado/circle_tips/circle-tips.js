[25/04/2026 01:56] KiloClawMagnus: Voici l'implémentation complète. Je te génère tous les fichiers + instructions.

───

📁 Structure des fichiers à créer

netlify/functions/circle-tips.js     ← Crée un PaymentIntent Circle
netlify/functions/circle-webhook.js  ← Reçoit les webhooks Circle → déclenche IA remerciement
public/fan-chat-widget.js            ← Widget mis à jour avec boutons de tip
index.html                           ← Boutons de tipping sur la page principale
netlify.toml                         ← Config build
.env.example                         ← Variables à configurer

───

1) netlify/functions/circle-tips.js

// netlify/functions/circle-tips.js
// Crée un Circle Crypto Payment Intent → retourne l'adresse de dépôt USDC
// POST /body: { amount: "5.00" | "10.00", tipperName: "Jean" }

const CIRCLE_SANDBOX = process.env.CIRCLE_SANDBOX === "true";
const CIRCLE_API_BASE = CIRCLE_SANDBOX
  ? "https://api-sandbox.circle.com"
  : "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || "";
const CIRCLE_MERCHANT_WALLET_ID = process.env.CIRCLE_MERCHANT_WALLET_ID || "";

function json(code, body) {
  return {
    statusCode: code,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  if (!CIRCLE_API_KEY || !CIRCLE_MERCHANT_WALLET_ID) {
    return json(500, {
      error: "Circle not configured. Set CIRCLE_API_KEY and CIRCLE_MERCHANT_WALLET_ID.",
    });
  }

  const { amount, tipperName } = JSON.parse(event.body || "{}");

  // Montants par défaut si non spécifiés
  const tipAmount =
    amount === "10" ? "10.00" : amount === "5" ? "5.00" : "5.00";
  const name = tipperName || "Fan";

  const idempotencyKey = uuid();

  // POST /v1/paymentIntents
  const url = `${CIRCLE_API_BASE}/v1/paymentIntents`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        "X-Requested-Id": uuid(),
      },
      body: JSON.stringify({
        idempotencyKey,
        amount: { amount: tipAmount, currency: "USD" },
        settlementCurrency: "USD",
        paymentMethods: [
          { type: "blockchain", chain: "BASE" }, // USDC sur Base (faible frais)
        ],
        merchantWalletId: CIRCLE_MERCHANT_WALLET_ID,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Circle API error:", data);
      return json(res.status, { error: "Circle API error", details: data });
    }

    const intent = data.data;

    // Retourne le paymentIntentId pour le polling côté front
    // Le front va appeler circle-tips.js?id=<intentId> pour récupérer l'adresse
    return json(200, {
      paymentIntentId: intent.id,
      amount: tipAmount,
      currency: intent.settlementCurrency,
      tipperName: name,
      status: intent.timeline?.[intent.timeline.length - 1]?.status || "created",
    });
  } catch (err) {
    console.error("circle-tips error:", err);
    return json(500, { error: "Failed to create payment intent" });
  }
};

// GET /?id=<paymentIntentId> → poll pour récupérer l'adresse de dépôt
exports.getDepositAddress = async (event) => {
  const intentId = event.queryStringParameters?.id;
  if (!intentId) return json(400, { error: "Missing ?id=" });
[25/04/2026 01:56] KiloClawMagnus:   const url = `${CIRCLE_API_BASE}/v1/paymentIntents/${intentId}`;

  try {
[25/04/2026 01:56] KiloClawMagnus: const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        "X-Requested-Id": uuid(),
      },
    });
    const data = await res.json();

    if (!res.ok) {
      return json(res.status, { error: "Circle API error", details: data });
    }

    const intent = data.data;
    const pm = intent.paymentMethods?.[0] || {};

    return json(200, {
      status: intent.timeline?.[intent.timeline.length - 1]?.status || "pending",
      address: pm.address || null,
      addressTag: pm.addressTag || null,
      chain: pm.chain || null,
      amount: intent.amount,
      amountPaid: intent.amountPaid,
    });
  } catch (err) {
    return json(500, { error: "Failed to fetch payment intent" });
  }
};

// Supporte GET via le même handler Netlify
// Netlify appelle .handler pour GET aussi, on détecte la méthode
const originalHandler = exports.handler;
exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return exports.getDepositAddress(event);
  }
  return originalHandler(event);
};

───

2) netlify/functions/circle-webhook.js

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