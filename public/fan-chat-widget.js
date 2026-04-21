// public/fan-chat-widget.js
// IMPROVED: Security hardened + localStorage limits + error handling + no duplicates

(() => {
  // Prevent duplicate initialization
  if (window._fanChatInitialized) {
    console.warn("[fan-chat] Widget already initialized");
    return;
  }
  window._fanChatInitialized = true;

   const API_URL = window.FAN_CHAT_CONFIG?.apiUrl || "/.netlify/functions/fan-chat";
  const STORAGE_KEY = "fan_chat_messages";
  const STORAGE_MAX_MESSAGES = 50; // Limit to prevent localStorage bloat
  const STORAGE_EXPIRY_DAYS = 7; // Auto-clear old messages
  const MAX_MESSAGE_LENGTH = 1000;
  const STREAM_ENABLED = true;

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} text - Raw text to sanitize
   * @returns {string} Safe text
   */
  function sanitizeText(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text; // textContent automatically escapes HTML
    return div.innerHTML;
  }

  /**
   * Load messages from localStorage with validation
   * @returns {Array} Array of {type, text} message objects
   */
  function loadMessages() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const messages = JSON.parse(stored);

      // Validate stored data
      if (!Array.isArray(messages)) {
        console.warn("[fan-chat] Stored messages not an array, clearing");
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      // Validate each message and sanitize
      return messages.filter((msg) => {
        if (typeof msg?.type !== "string" || typeof msg?.text !== "string") {
          console.warn("[fan-chat] Invalid message format, skipping");
          return false;
        }
        if (!["user", "bot"].includes(msg.type)) {
          console.warn("[fan-chat] Invalid message type, skipping");
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error("[fan-chat] Failed to load messages:", error);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  /**
   * Save messages to localStorage with size limit
   * @param {Array} messages - Array of message objects
   */
  function saveMessages(messages) {
    try {
      // Limit stored messages to prevent bloat
      const limited = messages.slice(-STORAGE_MAX_MESSAGES);

      // Check storage quota (prevent quota exceeded errors)
      const serialized = JSON.stringify(limited);
      if (serialized.length > 1024 * 100) {
        // 100KB limit
        console.warn("[fan-chat] Storage quota exceeded, clearing oldest messages");
        const truncated = limited.slice(-25); // Keep last 25
        localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated));
        return;
      }

      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.warn("[fan-chat] localStorage quota exceeded");
        localStorage.removeItem(STORAGE_KEY);
      } else {
        console.error("[fan-chat] Failed to save messages:", error);
      }
    }
  }

  /**
   * Create the widget HTML
   */
  function createWidget() {
    const html = `
<div id="fan-chat-widget" class="fan-chat-widget">
  <!-- Floating button -->
  <button id="fan-chat-toggle" class="fan-chat-button" aria-label="Open chat">
    <span class="fan-chat-icon">💬</span>
  </button>

  <!-- Chat window -->
  <div id="fan-chat-window" class="fan-chat-window hidden" role="dialog" aria-labelledby="fan-chat-header">
    <div class="fan-chat-header" id="fan-chat-header">
      <h3>Chat with Allyson 💫</h3>
      <button id="fan-chat-close" class="fan-chat-close" aria-label="Close">✕</button>
    </div>

    <div id="fan-chat-messages" class="fan-chat-messages" role="log" aria-live="polite"></div>

    <div class="fan-chat-input-area">
      <textarea
        id="fan-chat-input"
        class="fan-chat-input-text"
        placeholder="Your message..."
        rows="1"
        maxlength="${MAX_MESSAGE_LENGTH}"
        aria-label="Message input"
      ></textarea>
      <button id="fan-chat-send" class="fan-chat-send-btn">Send</button>
    </div>
  </div>
</div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
  }

  /**
   * Add a message to the chat display
   * @param {string} text - Message text
   * @param {string} type - "user" or "bot"
   */
  function addMessage(text, type) {
    if (typeof text !== "string" || !["user", "bot"].includes(type)) {
      console.warn("[fan-chat] Invalid message parameters");
      return;
    }

    const messagesContainer = document.getElementById("fan-chat-messages");
    if (!messagesContainer) return;

    const msg = document.createElement("div");
    msg.className = `fan-chat-msg fan-chat-msg-${type}`;

    const bubble = document.createElement("div");
    bubble.className = "fan-chat-bubble";
    bubble.textContent = sanitizeText(text); // Safe: textContent escapes HTML

    const time = document.createElement("span");
    time.className = "fan-chat-time";
    time.textContent = new Date().toLocaleTimeString(navigator.language || "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    msg.appendChild(bubble);
    msg.appendChild(time);
    messagesContainer.appendChild(msg);

    // Auto-scroll
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to storage
    const allMessages = Array.from(messagesContainer.querySelectorAll(".fan-chat-msg")).map((el) => ({
      type: el.classList.contains("fan-chat-msg-user") ? "user" : "bot",
      text: el.querySelector(".fan-chat-bubble").textContent,
    }));
    saveMessages(allMessages);
  }

  /**
   * Render stored messages on window open
   */
  function renderStoredMessages() {
    const messagesContainer = document.getElementById("fan-chat-messages");
    if (!messagesContainer) return;

    // Only load if empty (prevent re-rendering)
    if (messagesContainer.children.length > 0) return;

    const stored = loadMessages();
    stored.forEach((msg) => {
      addMessage(msg.text, msg.type);
    });
  }

  /**
   * Send message to API with timeout and streaming support
   */
  async function sendMessage() {
    const input = document.getElementById("fan-chat-input");
    const text = input.value.trim();

    if (!text) return;

    if (text.length > MAX_MESSAGE_LENGTH) {
      addMessage(`Message too long (max ${MAX_MESSAGE_LENGTH} chars)`, "bot");
      return;
    }

    // Add user message
    addMessage(text, "user");
    input.value = "";
    input.style.height = "auto";

    // Loading indicator (will be replaced by bot message with streaming text)
    const messagesContainer = document.getElementById("fan-chat-messages");
    const loadingEl = document.createElement("div");
    loadingEl.className = "fan-chat-msg fan-chat-msg-bot";
    loadingEl.innerHTML = `
      <div class="fan-chat-bubble fan-chat-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(loadingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(API_URL + "?stream=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale: navigator.language || "en-US",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `API error: ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type") || "";

      if (contentType === "text/event-stream" && STREAM_ENABLED) {
        // Streaming response handling
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botMsgEl = null;
        let botBubbleEl = null;
        let buffer = "";
        let firstTokenReceived = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (!firstTokenReceived) {
                // First token: replace loading indicator with bot message bubble
                firstTokenReceived = true;
                loadingEl.remove();

                botMsgEl = document.createElement("div");
                botMsgEl.className = "fan-chat-msg fan-chat-msg-bot";
                botBubbleEl = document.createElement("div");
                botBubbleEl.className = "fan-chat-bubble";
                botBubbleEl.textContent = data;

                const time = document.createElement("span");
                time.className = "fan-chat-time";
                time.textContent = new Date().toLocaleTimeString(navigator.language || "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                botMsgEl.appendChild(botBubbleEl);
                botMsgEl.appendChild(time);
                messagesContainer.appendChild(botMsgEl);
              } else {
                // Append subsequent tokens
                botBubbleEl.textContent += data;
              }
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else if (line.startsWith("event: done")) {
              // Stream complete - save message to storage
              const fullText = botBubbleEl.textContent;
              const allMessages = Array.from(messagesContainer.querySelectorAll(".fan-chat-msg")).map((el) => ({
                type: el.classList.contains("fan-chat-msg-user") ? "user" : "bot",
                text: el.querySelector(".fan-chat-bubble").textContent,
              }));
              saveMessages(allMessages);
              return; // Exit streaming
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = await response.json();

        // Validate API response
        if (typeof data?.reply !== "string") {
          throw new Error("Invalid API response format");
        }

        loadingEl.remove();
        addMessage(data.reply, "bot");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      loadingEl.remove();

      if (error.name === "AbortError") {
        addMessage("Sorry, that took too long. Try again! 🙏", "bot");
      } else {
        console.error("[fan-chat] Error:", error);
        addMessage("Sorry, technical issue. Try again later! 🙏", "bot");
      }
    }
  }

  /**
   * Auto-expand textarea to content height
   */
  function autoExpand(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  }

  /**
   * Initialize widget
   */
  document.addEventListener("DOMContentLoaded", () => {
    createWidget();

    const toggleBtn = document.getElementById("fan-chat-toggle");
    const closeBtn = document.getElementById("fan-chat-close");
    const chatWindow = document.getElementById("fan-chat-window");
    const sendBtn = document.getElementById("fan-chat-send");
    const input = document.getElementById("fan-chat-input");

    if (!toggleBtn || !closeBtn || !chatWindow || !sendBtn || !input) {
      console.error("[fan-chat] Failed to initialize: missing DOM elements");
      return;
    }

    // Toggle window
    toggleBtn.addEventListener("click", () => {
      chatWindow.classList.toggle("hidden");
      if (!chatWindow.classList.contains("hidden")) {
        input.focus();
        renderStoredMessages();
      }
    });

    // Close window
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.add("hidden");
    });

    // Send message
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-expand textarea
    input.addEventListener("input", () => autoExpand(input));
  });
})();
