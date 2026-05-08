/**
 * MVP: Fan Chat Tipping Integration
 * Simple tipping UI for fan-chat widget
 */

(() => {
  const TIP_AMOUNTS = [
    { value: 5, label: "💶 Tip 5€", currency: "EUR" },
    { value: 10, label: "💎 Tip 10 USDC", currency: "USDC" },
  ];

  window.initTipping = function() {
    const messagesContainer = document.getElementById("fan-chat-messages");
    if (!messagesContainer) return;

    // Add tipping buttons after first interaction
    const addTipButtons = () => {
      if (document.getElementById("fan-chat-tip-buttons")) return; // Already added

      const tipDiv = document.createElement("div");
      tipDiv.id = "fan-chat-tip-buttons";
      tipDiv.className = "fan-chat-tip-buttons";
      tipDiv.innerHTML = `
<div class="fan-chat-tip-header">❤️ Support Allyson</div>
${TIP_AMOUNTS.map(
  (t) => `
<button class="fan-chat-tip-btn" data-amount="${t.value}" data-currency="${t.currency}">
  ${t.label}
</button>
`
).join("")}
      `;

      messagesContainer.appendChild(tipDiv);

      // Setup listeners
      tipDiv.querySelectorAll(".fan-chat-tip-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          handleTip(btn.dataset.amount, btn.dataset.currency);
        });
      });
    };

    // Add buttons on first message from bot
    const observer = new MutationObserver(() => {
      if (messagesContainer.children.length > 0) {
        addTipButtons();
        observer.disconnect();
      }
    });

    observer.observe(messagesContainer, { childList: true });
  };

  async function handleTip(amount, currency) {
    const name = prompt("Your name?");
    if (!name) return;

    const email = prompt("Your email? (for thank you message)");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Invalid email");
      return;
    }

    try {
      // Call payment API
      const response = await fetch("/.netlify/functions/circle-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          fanEmail: email,
          fanName: name,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Call webhook to generate thank you message
      const webhookResponse = await fetch("/.netlify/functions/circle-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fanName: name,
          fanEmail: email,
          amount,
          intentId: data.intentId,
        }),
      });

      const webhookData = await webhookResponse.json();

      if (webhookData.success && webhookData.message) {
        // Show thank you message in chat
        showThankYouMessage(name, webhookData.message, amount, currency);
      }

      alert(
        data.isMocked
          ? `✅ MVP Test: $${amount} tip processed (mocked)\n\n${webhookData.message}`
          : `✅ Tip confirmed! Check your email for Allyson's message.`
      );
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  function showThankYouMessage(name, message, amount, currency) {
    const messagesContainer = document.getElementById("fan-chat-messages");
    if (!messagesContainer) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "fan-chat-msg fan-chat-msg-bot";

    const bubble = document.createElement("div");
    bubble.className = "fan-chat-bubble";
    bubble.textContent = message;

    const time = document.createElement("span");
    time.className = "fan-chat-time";
    time.textContent = new Date().toLocaleTimeString(navigator.language || "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(time);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
})();
