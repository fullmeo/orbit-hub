/**
 * Tipping Component for Circle USDC Payments
 * Standalone module for showing tip buttons and handling payments
 */

(() => {
  // Prevent duplicate initialization
  if (window._tipComponentInitialized) {
    console.warn("[tip-component] Already initialized");
    return;
  }
  window._tipComponentInitialized = true;

  const API_URL = window.TIP_CONFIG?.apiUrl || "/.netlify/functions/circle-payment";
  const TIP_AMOUNTS = [
    { value: 5, label: "Tip 5 €", currency: "EUR", icon: "🎵" },
    { value: 10, label: "Tip 10 USDC", currency: "USDC", icon: "💎" },
  ];

  // Circle's web SDK (loaded from CDN)
  const CIRCLE_SDK_URL = "https://cdn.circle.com/v0/sdk/circle.js";

  /**
   * Initialize Circle SDK
   */
  async function initCircleSDK() {
    return new Promise((resolve, reject) => {
      if (window.Circle) {
        resolve(window.Circle);
        return;
      }

      const script = document.createElement("script");
      script.src = CIRCLE_SDK_URL;
      script.async = true;

      script.onload = () => {
        if (window.Circle) {
          resolve(window.Circle);
        } else {
          reject(new Error("Circle SDK failed to load"));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load Circle SDK from CDN"));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Create tipping UI HTML
   */
  function createTipButton(amount) {
    return `
<button
  class="tip-button"
  data-amount="${amount.value}"
  data-currency="${amount.currency}"
  aria-label="${amount.label}"
  title="${amount.label}"
>
  <span class="tip-icon">${amount.icon}</span>
  <span class="tip-label">${amount.label}</span>
</button>
    `;
  }

  function createTipContainer() {
    const html = `
<div id="tip-component" class="tip-container">
  <div class="tip-header">
    <h3>❤️ Support Allyson</h3>
    <p>Send a tip to support her music</p>
  </div>

  <div class="tip-buttons">
    ${TIP_AMOUNTS.map(createTipButton).join("")}
  </div>

  <!-- Payment Modal -->
  <div id="tip-payment-modal" class="tip-modal hidden">
    <div class="tip-modal-content">
      <button class="tip-modal-close" aria-label="Close">✕</button>

      <h2>Send a Tip 💝</h2>

      <div id="tip-amount-display" class="tip-amount-display"></div>

      <!-- Fan Info Form -->
      <div class="tip-form">
        <input
          type="text"
          id="tip-fan-name"
          class="tip-input"
          placeholder="Your name"
          required
        />
        <input
          type="email"
          id="tip-fan-email"
          class="tip-input"
          placeholder="your@email.com"
          required
        />
      </div>

      <!-- Circle Payment Container -->
      <div id="tip-circle-container" class="tip-circle-container"></div>

      <button id="tip-pay-button" class="tip-pay-button" disabled>
        Processing...
      </button>

      <p class="tip-security-notice">
        🔒 Powered by <strong>Circle</strong> - Secure USDC payments
      </p>
    </div>
  </div>

  <!-- Success Message -->
  <div id="tip-success-modal" class="tip-modal hidden">
    <div class="tip-modal-content tip-success">
      <h2>💫 Thank You!</h2>
      <p id="tip-success-message">Your tip has been sent!</p>
      <button id="tip-success-close" class="tip-button">
        Back to Chat
      </button>
    </div>
  </div>
</div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    return container.firstElementChild;
  }

  /**
   * Load and setup Circle Web SDK
   */
  async function setupCirclePayment(intentId, clientToken, amount) {
    try {
      const Circle = await initCircleSDK();

      if (!Circle) {
        throw new Error("Circle SDK not available");
      }

      // Initialize Circle Web SDK
      const circle = new Circle.Web({
        clientToken: clientToken,
      });

      // Get container and initialize card element
      const container = document.getElementById("tip-circle-container");
      container.innerHTML = ""; // Clear previous

      // Create payment element
      const paymentElement = circle.paymentElement({
        displayNetwork: "hidden",
      });

      // Mount the element
      container.appendChild(paymentElement.getElement());

      console.log("[Circle] SDK initialized for payment");

      // Setup pay button
      const payButton = document.getElementById("tip-pay-button");
      payButton.disabled = false;
      payButton.textContent = `Pay $${amount} USD`;

      payButton.onclick = async () => {
        payButton.disabled = true;
        payButton.textContent = "Processing...";

        try {
          const result = await circle.createPayment({
            idempotencyKey: `tip-${Date.now()}`,
          });

          if (result.status === "complete") {
            showSuccessMessage(amount);
          } else if (result.status === "pending") {
            showSuccessMessage(amount, "Pending verification");
          } else {
            throw new Error(result.message || "Payment failed");
          }
        } catch (error) {
          console.error("[Payment Error]", error);
          payButton.disabled = false;
          payButton.textContent = "Try Again";
          alert(`Payment failed: ${error.message}`);
        }
      };
    } catch (error) {
      console.error("[Circle Setup Error]", error);
      const container = document.getElementById("tip-circle-container");
      container.innerHTML = `<p style="color: red;">Payment setup failed: ${error.message}</p>`;
    }
  }

  /**
   * Handle tip button click
   */
  async function handleTipClick(amount, currency) {
    const modal = document.getElementById("tip-payment-modal");
    const amountDisplay = document.getElementById("tip-amount-display");

    amountDisplay.innerHTML = `<p>Amount: <strong>$${amount} ${currency}</strong></p>`;
    modal.classList.remove("hidden");

    // Focus name input
    document.getElementById("tip-fan-name").focus();

    // Setup payment form submission
    const fanNameInput = document.getElementById("tip-fan-name");
    const fanEmailInput = document.getElementById("tip-fan-email");
    const payButton = document.getElementById("tip-pay-button");

    const handlePaymentSetup = async () => {
      const fanName = fanNameInput.value.trim();
      const fanEmail = fanEmailInput.value.trim();

      if (!fanName || !fanEmail) {
        alert("Please enter your name and email");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fanEmail)) {
        alert("Invalid email");
        return;
      }

      payButton.disabled = true;
      payButton.textContent = "Initializing...";

      try {
        // Get payment intent from our API
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            fanEmail,
            fanName,
            type: "tip",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }

        const data = await response.json();
        const { clientToken, intentId } = data;

        // Setup Circle payment UI
        await setupCirclePayment(intentId, clientToken, amount);

        // Remove temporary listeners
        payButton.removeEventListener("click", handlePaymentSetup);
      } catch (error) {
        console.error("[Setup Error]", error);
        payButton.disabled = false;
        payButton.textContent = "Try Again";
        alert(`Error: ${error.message}`);
      }
    };

    payButton.addEventListener("click", handlePaymentSetup);
  }

  /**
   * Show success message
   */
  function showSuccessMessage(amount, customMessage = null) {
    const paymentModal = document.getElementById("tip-payment-modal");
    const successModal = document.getElementById("tip-success-modal");
    const successMessage = document.getElementById("tip-success-message");

    paymentModal.classList.add("hidden");

    successMessage.textContent =
      customMessage ||
      `Thank you for your $${amount} tip! Allyson will send you a special message soon 💫`;

    successModal.classList.remove("hidden");

    // Auto-close after 5 seconds
    setTimeout(() => {
      closeAllModals();
    }, 5000);
  }

  /**
   * Close all modals
   */
  function closeAllModals() {
    document.getElementById("tip-payment-modal").classList.add("hidden");
    document.getElementById("tip-success-modal").classList.add("hidden");
  }

  /**
   * Initialize component
   */
  document.addEventListener("DOMContentLoaded", () => {
    // Create and insert component
    const tipComponent = createTipContainer();
    const container = document.getElementById("tip-component-container");

    if (!container) {
      console.warn("[tip-component] No #tip-component-container found");
      return;
    }

    container.appendChild(tipComponent);

    // Setup event listeners
    document.querySelectorAll(".tip-button[data-amount]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const amount = parseInt(btn.dataset.amount);
        const currency = btn.dataset.currency;
        handleTipClick(amount, currency);
      });
    });

    // Modal close buttons
    document.getElementById("tip-modal-close").addEventListener("click", () => {
      closeAllModals();
    });

    document
      .getElementById("tip-success-close")
      .addEventListener("click", () => {
        closeAllModals();
      });

    console.log("[tip-component] Initialized");
  });
})();
