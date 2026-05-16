/**
 * ORBIT Tipping Widget - USDC via Circle
 * Handles tip button clicks and payment flow
 */

(() => {
  if (window._tippingWidgetInitialized) {
    console.warn('[tipping] Widget already initialized');
    return;
  }
  window._tippingWidgetInitialized = true;

  const API_URL = window.TIPPING_CONFIG?.apiUrl || '/.netlify/functions/circle-tips';
  const THANK_YOU_API = window.TIPPING_CONFIG?.thankYouApi || '/.netlify/functions/get-thanks';
  const POLL_INTERVAL = 3000; // Poll every 3 seconds for payment confirmation
  const MAX_POLLS = 40; // 2 minutes max

  let activePaymentId = null;
  let pollCount = 0;

  function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function createModal(amount, tipType) {
    const html = `
      <div id="tip-overlay" class="tip-overlay" role="dialog" aria-labelledby="tip-modal-header">
        <div class="tip-modal">
          <div class="tip-modal-header">
            <h3 id="tip-modal-header">💰 Support Allyson with USDC</h3>
            <button class="tip-modal-close" aria-label="Close">&times;</button>
          </div>

          <div class="tip-modal-content">
            <p>Thank you for supporting Allyson's music! 🎵</p>

            <div class="payment-request">
              <div class="payment-amount" id="amount-display">${amount}</div>
              <div class="payment-label">USDC on Base</div>
            </div>

            <p style="font-size: 13px; color: #666;">
              Send <strong>${amount} USDC</strong> to this wallet address:
            </p>

            <div class="payment-address" id="payment-address">
              Loading address...
            </div>

            <button class="copy-btn" id="copy-btn">📋 Copy Address</button>

            <div id="payment-status" style="margin-top: 16px;"></div>

            <div class="tip-modal-actions" style="margin-top: 20px;">
              <button class="btn-secondary" id="tip-cancel-btn">Cancel</button>
              <button class="btn-primary" id="tip-check-btn" style="display: none;">Checking Payment...</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);

    return {
      overlay: document.getElementById('tip-overlay'),
      closeBtn: document.querySelector('.tip-modal-close'),
      cancelBtn: document.getElementById('tip-cancel-btn'),
      checkBtn: document.getElementById('tip-check-btn'),
      addressEl: document.getElementById('payment-address'),
      statusEl: document.getElementById('payment-status'),
      copyBtn: document.getElementById('copy-btn'),
    };
  }

  function closeModal() {
    const overlay = document.getElementById('tip-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 300);
    }
    activePaymentId = null;
    pollCount = 0;
  }

  async function createPayment(amount) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount: amount === '5' ? 'small' : amount === '10' ? 'large' : amount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment');
      }

      return data;
    } catch (error) {
      console.error('[tipping] Payment creation failed:', error);
      throw error;
    }
  }

  async function checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-status',
          paymentId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[tipping] Status check failed:', error);
      return { confirmed: false };
    }
  }

  async function getThankYouMessage(paymentId) {
    try {
      const response = await fetch(`${THANK_YOU_API}?paymentId=${paymentId}`);
      const data = await response.json();

      if (data.found) {
        return data.message;
      }
      return null;
    } catch (error) {
      console.error('[tipping] Failed to get thank you message:', error);
      return null;
    }
  }

  async function pollForPaymentConfirmation(paymentId, modal) {
    pollCount++;

    if (pollCount > MAX_POLLS) {
      modal.statusEl.innerHTML = `
        <div class="tip-error-msg">
          ⏱️ Payment check timed out. Please try again in a few moments.
        </div>
      `;
      modal.checkBtn.style.display = 'none';
      return;
    }

    const status = await checkPaymentStatus(paymentId);

    if (status.confirmed) {
      modal.statusEl.innerHTML = `
        <div class="tip-success-msg">
          ✅ Payment confirmed! Thank you so much! 💫
        </div>
      `;

      // Get thank you message from Claude
      setTimeout(async () => {
        const thankYouMsg = await getThankYouMessage(paymentId);
        if (thankYouMsg) {
          // Inject message into fan chat if it exists
          if (window.FAN_CHAT_INJECTOR) {
            window.FAN_CHAT_INJECTOR.injectMessage(thankYouMsg, 'bot');
            window.FAN_CHAT_INJECTOR.openChat(); // Open chatbot
          }

          modal.statusEl.innerHTML += `
            <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
              <strong style="color: #333;">💫 From Allyson:</strong><br>
              <em style="color: #555;">"${sanitize(thankYouMsg)}"</em>
            </div>
          `;
        }
      }, 1000); // Give Claude a moment to generate the message

      modal.checkBtn.style.display = 'none';
      return;
    }

    // Keep checking
    const remainingSeconds = Math.floor((MAX_POLLS - pollCount) * POLL_INTERVAL / 1000);
    modal.checkBtn.textContent = `Checking... (${remainingSeconds}s)`;
    setTimeout(() => pollForPaymentConfirmation(paymentId, modal), POLL_INTERVAL);
  }

  function initiateTipping(amount, tipType) {
    const modal = createModal(amount, tipType);

    // Close handlers
    modal.closeBtn.addEventListener('click', closeModal);
    modal.cancelBtn.addEventListener('click', closeModal);

    // Overlay click to close
    modal.overlay.addEventListener('click', (e) => {
      if (e.target === modal.overlay) closeModal();
    });

    // Create payment
    (async () => {
      try {
        modal.statusEl.innerHTML = `
          <div style="text-align: center; padding: 12px;">
            <div class="tip-spinner"></div>
            Creating payment request...
          </div>
        `;

        const payment = await createPayment(amount);
        activePaymentId = payment.paymentId;
        modal.addressEl.textContent = payment.paymentId; // Placeholder - in real Circle, this would be the wallet address

        // Copy to clipboard
        modal.copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(payment.paymentId);
            modal.copyBtn.textContent = '✅ Copied!';
            modal.copyBtn.classList.add('copied');
            setTimeout(() => {
              modal.copyBtn.textContent = '📋 Copy Address';
              modal.copyBtn.classList.remove('copied');
            }, 2000);
          } catch (error) {
            console.error('[tipping] Copy failed:', error);
          }
        });

        modal.statusEl.innerHTML = `
          <div style="font-size: 13px; color: #666;">
            ✨ Payment ID: <strong>${payment.paymentId}</strong>
          </div>
        `;

        modal.checkBtn.textContent = 'Checking for Payment...';
        modal.checkBtn.style.display = 'block';

        // Start polling
        await pollForPaymentConfirmation(payment.paymentId, modal);
      } catch (error) {
        console.error('[tipping] Error:', error);
        modal.statusEl.innerHTML = `
          <div class="tip-error-msg">
            ❌ Error: ${sanitize(error.message)}
          </div>
        `;
      }
    })();
  }

  // Export for use in HTML
  window.TippingWidget = {
    tip: initiateTipping,
    closeModal,
  };

  console.log('[tipping] Widget ready - use TippingWidget.tip(amount)');
})();
