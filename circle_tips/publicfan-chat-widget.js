// public/fan-chat-widget.js — Version avec tipping USDC intégré


(function () {
  const TIP_API = "/.netlify/functions/circle-tips";
  const THANKS_API = "/.netlify/functions/get-thanks";

  // ─── Styles ───
  const style = document.createElement("style");
  style.textContent = `
    /* ─── Launcher & Panel (existants) ─── */
    .fan-chat-launcher {
      position: fixed; right: 20px; bottom: 20px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 999px; border: none;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
      cursor: pointer; font-size: 24px;
      box-shadow: 0 10px 25px rgba(99,102,241,.35);
      transition: transform .2s;
    }
    .fan-chat-launcher:hover { transform: scale(1.08); }
    .fan-chat-panel {
      position: fixed; right: 20px; bottom: 88px; z-index: 9999;
      width: 350px; max-width: calc(100vw - 24px);
      height: 500px; background: #fff; border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,.22);
      display: none; overflow: hidden; border: 1px solid #e5e7eb;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .fan-chat-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; padding: 12px 14px; font-weight: 600; font-size: 14px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .fan-chat-messages {
      padding: 12px; height: 340px; overflow-y: auto; background: #f9fafb;
    }
    .fan-chat-msg { margin: 8px 0; line-height: 1.4; }
    .fan-chat-msg.user { text-align: right; }
    .fan-chat-bubble {
      display: inline-block; padding: 10px 12px; border-radius: 12px; max-width: 85%;
      white-space: pre-wrap; word-wrap: break-word;
    }
    .fan-chat-msg.user .fan-chat-bubble {
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
    }
    .fan-chat-msg.bot .fan-chat-bubble { background: #fff; color: #111; border: 1px solid #e5e7eb; }
    .fan-chat-msg.thank .fan-chat-bubble {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #78350f; border: 1px solid #f59e0b; font-style: italic;
    }
    .fan-chat-input {
      display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e5e7eb; background: #fff;
    }
    .fan-chat-input input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px; outline: none;
    }
    .fan-chat-input button {
      border: none; border-radius: 10px; padding: 10px 14px; cursor: pointer;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
    }

    /* ─── Tipping section dans le chatbot ─── */
    .fan-chat-tip-section {
      padding: 10px 12px; border-top: 1px solid #e5e7eb;
      background: #faf5ff; text-align: center;
    }
    .fan-chat-tip-section p {
      margin: 0 0 8px; font-size: 13px; color: #6b7280;
    }
    .fan-chat-tip-section p strong { color: #7c3aed; }
    .tip-buttons { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .tip-btn {
      border: none; border-radius: 12px; padding: 10px 18px; cursor: pointer;
      font-size: 13px; font-weight: 600; transition: all .15s;
    }
    .tip-btn.eur {
      background: linear-gradient(135deg, #10b981, #059669); color: #fff;
    }
    .tip-btn.usdc {
      background: linear-gradient(135deg, #2771d1, #1e56a8); color: #fff;
    }
    .tip-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .tip-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    /* ─── Modal de paiement ─── */
    .tip-modal-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center;
    }
    .tip-modal {
      background: #fff; border-radius: 16px; padding: 24px; max-width: 380px; width: 90%;
      box-shadow: 0 20px 40px rgba(0,0,0,.3); text-align: center;
      font-family: Inter, system-ui, sans-serif;
    }
    .tip-modal h3 { margin: 0 0 12px; font-size: 18px; color: #111; }
.tip-modal .amount-display {
      font-size: 32px; font-weight: 700; margin: 8px 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .tip-modal .wallet-address {
      background: #f3f4f6; border-radius: 8px; padding: 12px;
      font-family: monospace; font-size: 12px; word-break: break-all;
      margin: 12px 0; cursor: pointer; border: 1px dashed #d1d5db;
    }
    .tip-modal .wallet-address:hover { background: #e5e7eb; }
    .tip-modal .status { font-size: 13px; color: #6b7280; margin-top: 8px; }
    .tip-modal .status.pending { color: #f59e0b; }
    .tip-modal .status.success { color: #10b981; font-weight: 600; }
    .tip-modal .close-btn {
      margin-top: 16px; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 8px 20px; cursor: pointer; background: #fff;
    }

    /* ─── Tipping sur la page principale (inline) ─── */
    .orbit-tip-section {
      margin: 32px auto; max-width: 500px; text-align: center;
      padding: 24px; border-radius: 16px;
      background: linear-gradient(135deg, #faf5ff, #fef3c7);
      border: 1px solid #e5e7eb;
    }
    .orbit-tip-section h3 {
      margin: 0 0 4px; font-size: 18px; font-family: Inter, sans-serif;
    }
    .orbit-tip-section .subtitle {
      margin: 0 0 16px; font-size: 13px; color: #6b7280; font-family: Inter, sans-serif;
    }
    .orbit-tip-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  `;
  document.head.appendChild(style);

  // ─── Launcher + Panel ───
  const launcher = document.createElement("button");
  launcher.className = "fan-chat-launcher";
  launcher.title = "Chat fan";
  launcher.innerText = "💬";

  const panel = document.createElement("div");
  panel.className = "fan-chat-panel";
  panel.innerHTML = `
    <div class="fan-chat-header">
      <span>Fan Chat • Orbit-Hub</span>
      <button id="fan-chat-close" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;">×</button>
    </div>
    <div class="fan-chat-messages" id="fan-chat-messages"></div>
    <form class="fan-chat-input" id="fan-chat-form">
      <input id="fan-chat-input" type="text" placeholder="Pose ta question..." autocomplete="off" />
      <button type="submit">Envoyer</button>
    </form>
    <div class="fan-chat-tip-section">
      <p><strong>Soutenir l'artiste</strong> 💜</p>
      <div class="tip-buttons">
        <button class="tip-btn eur" data-amount="5">Tip 5 €</button>
        <button class="tip-btn usdc" data-amount="10">Tip 10 USDC</button>
      </div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#fan-chat-messages");
  const form = panel.querySelector("#fan-chat-form");
  const input = panel.querySelector("#fan-chat-input");
  const closeBtn = panel.querySelector("#fan-chat-close");

  function addMsg(text, role = "bot") {
    const wrap = document.createElement("div");
    wrap.className = `fan-chat-msg ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "fan-chat-bubble";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  addMsg("Hey 👋 Je suis le fan chat officiel. Tu veux la bio, les liens streaming, les dates ou le merch ? Tu peux aussi soutenir l'artiste avec un tip 💜");

  launcher.addEventListener("click", () => {
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  });

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // ─── Chat normal ───
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "user");
    input.value = "";
    addMsg("Je réfléchis…", "bot");
    const last = messagesEl.lastElementChild;
    try {
      const res = await fetch("/.netlify/functions/fan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale: navigator.language || "fr-FR" }),
      });
      const data = await res.json();
      last.querySelector(".fan-chat-bubble").textContent =
        data.reply || "Désolé, je n'ai pas réussi à répondre.";
    } catch {
      last.querySelector(".fan-chat-bubble").textContent =
        "Oups, petit souci technique 🙏";
    }
  });

  // ─── Tip buttons dans le widget ───
  panel.querySelectorAll(".tip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openTipModal(btn.dataset.amount, btn.classList.contains("usdc") ? "USDC" : "EUR");
    });
  });

  // ─── Modal de paiement ───
  let pollInterval = null;

  function openTipModal(amount, currency) {
    const overlay = document.createElement("div");
    overlay.className = "tip-modal-overlay";
    overlay.id = "tip-modal-overlay";
    overlay.innerHTML = `
      <div class="tip-modal">
        <h3>💜 Soutenir l'artiste</h3>
        <div class="amount-display">${amount} ${currency}</div>
        <p style="font-size:13px;color:#6b7280;">Envoie des ${currency} à l'adresse ci-dessous :</p>
        <div class="wallet-address" id="tip-wallet-addr" title="Cliquer pour copier">
          Chargement de l'adresse…
        </div>
        <div class="status pending" id="tip-status">⏳ Génération de l'adresse…</div>
        <button class="close-btn" id="tip-close">Fermer</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.style.display = "flex";

    const addrEl = overlay.querySelector("#tip-wallet-addr");
    const statusEl = overlay.querySelector("#tip-status");

    // 1. Créer le PaymentIntent
    fetch(TIP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, tipperName: "Fan" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          addrEl.textContent = "Erreur de configuration";
          statusEl.textContent = "❌ " + data.error;
          return;
        }

        statusEl.textContent = "⏳ Récupération de l'adresse de dépôt…";

        // 2. Poll pour récupérer l'adresse
        const intentId = data.paymentIntentId;
        pollInterval = setInterval(() => {
          fetch(`${TIP_API}?id=${intentId}`)
            .then((r) => r.json())
            .then((addrData) => {
              if (addrData.address) {
                clearInterval(pollInterval);
                addrEl.textContent = addrData.address;
                statusEl.className = "status success";
                statusEl.textContent =
                  "✅ Envoie tes " + amount + " " + currency + " à cette adresse !";

                // Clic = copier
                addrEl.addEventListener("click", () => {
                  navigator.clipboard.writeText(addrData.address);
                  statusEl.textContent = "📋 Adresse copiée !";
                  setTimeout(() => {
                    statusEl.textContent = "✅ Envoie tes " + amount + " " + currency + " à cette adresse !";
                  }, 2000);
                });
              } else if (addrData.status === "failed") {
                clearInterval(pollInterval);
                statusEl.textContent = "❌ Le paiement a échoué";
              }
            })
            .catch(() => {});
        }, 3000);

        // Timeout après 5 min
        setTimeout(() => {
          if (pollInterval) clearInterval(pollInterval);
        }, 300000);
      })
.catch(() => {
        addrEl.textContent = "Erreur réseau";
        statusEl.textContent = "❌ Impossible de contacter le serveur";
      });

    overlay.querySelector("#tip-close").addEventListener("click", () => {
      if (pollInterval) clearInterval(pollInterval);
      overlay.remove();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        if (pollInterval) clearInterval(pollInterval);
        overlay.remove();
      }
    });
  }

  // ─── Poll pour les remerciements IA ───
  // Toutes les 10 secondes, vérifier si un nouveau tip a été reçu
  let lastThanksCount = 0;
  setInterval(async () => {
    if (panel.style.display !== "block") return; // widget fermé
    try {
      const res = await fetch(THANKS_API);
      const data = await res.json();
      if (data.thanks && data.thanks.length > lastThanksCount) {
        const newOnes = data.thanks.slice(lastThanksCount);
        lastThanksCount = data.thanks.length;
        for (const t of newOnes) {
          if (t.message) {
            addMsg("🎵 " + t.message, "thank");
          }
        }
      }
    } catch {}
  }, 10000);

  // ─── Injecter les boutons inline sur la page principale ───
  function injectInlineTipSection() {
    // Cherche un conteneur proche des liens streaming
    const streamLinks = document.querySelector(
      '[class*="social"], [class*="stream"], [class*="link"], [class*="listen"], [class*="music"]'
    );
    if (!streamLinks) return;

    const section = document.createElement("div");
    section.className = "orbit-tip-section";
    section.innerHTML = `
      <h3>💜 Soutenir l'artiste</h3>
      <p class="subtitle">Ton soutien fait toute la différence</p>
      <div class="orbit-tip-buttons">
        <button class="tip-btn eur" onclick="document.querySelector('.fan-chat-launcher').click(); setTimeout(()=>document.querySelector('[data-amount=5]').click(), 300)">Tip 5 €</button>
        <button class="tip-btn usdc" onclick="document.querySelector('.fan-chat-launcher').click(); setTimeout(()=>document.querySelector('[data-amount=10]').click(), 300)">Tip 10 USDC</button>
      </div>
    `;

    // Insère après les liens streaming
    streamLinks.insertAdjacentElement("afterend", section);
  }

  // Exécute après DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectInlineTipSection);
  } else {
    injectInlineTipSection();
  }
})();

