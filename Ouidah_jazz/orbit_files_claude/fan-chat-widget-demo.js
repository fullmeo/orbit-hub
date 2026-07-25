/**
 * ORBIT Fan Chat Widget - DEMO VERSION (No API required)
 * 
 * This version simulates responses without needing ANTHROPIC_API_KEY
 * Perfect for testing UX/UI, design, and user interactions
 * 
 * Features:
 * - Mock responses based on keywords
 * - Simulates response delays (realistic)
 * - Dark mode support
 * - Mobile responsive
 * - localStorage persistence
 * - No API calls = no costs
 */

(function() {
  'use strict';

  // ========================================================================
  // CONFIGURATION
  // ========================================================================

  const CONFIG = {
    artistName: 'Allyson Glado',
    artistTone: 'chaleureux, inspirant, accessible, poétique',
    theme: localStorage.getItem('fan-chat-theme') || 'dark',
    maxMessages: 50,
    maxStorageSize: 100000, // bytes
    responseDelay: 1500, // ms - simulate thinking
  };

  // ========================================================================
  // MOCK RESPONSES (AI simulation)
  // ========================================================================

  const MOCK_RESPONSES = {
    // Greetings
    greetings: [
      "Salut! Bienvenue! 🎵 Je suis heureux de te rencontrer. Comment ça va?",
      "Bonjour! Merci d'être là. C'est un plaisir de discuter avec toi.",
      "Hey! Content de te voir. Qu'est-ce que tu aimerais savoir?",
      "Salut ami! 🌟 Comment je peux t'aider aujourd'hui?",
    ],
    
    // About Allyson
    aboutArtist: [
      "Je suis Allyson Glado, artiste reggae-pop basée à Paris. Ma musique mélange les rythmes caribéens authentiques avec des influences soul et jazz. 🎶",
      "Je crée de la musique qui célèbre la vie, l'amour et la transformation personnelle. Chaque chanson est un voyage émotionnel.",
      "Mon projet s'appelle Élévation - c'est ma vision d'élever l'art reggae-pop à un nouveau niveau avec l'authenticité et la poésie.",
    ],
    
    // About Albums
    albums: [
      "J'ai sorti deux albums: 'S-Moi' en 2018 et 'Élévation' en 2021. Les deux sont disponibles sur tous les plateformes de streaming! 🎧",
      "'Élévation' est mon album le plus personnel - il parle de croissance, de découverte de soi, et de connexion spirituelle.",
      "'S-Moi' était mon premier pas dans l'industrie musicale - c'était un moment de clarté et d'authenticité pure.",
    ],
    
    // Music & Streaming
    streaming: [
      "Tu peux m'écouter sur Spotify, Apple Music, YouTube, Deezer, et SoundCloud! Clique sur les liens ci-dessus pour accéder. 🎵",
      "Tous mes albums sont disponibles sur les grandes plateformes. Mon son préféré? 'Élévation' titre - c'est un hymne! 🎶",
      "La musique c'est fait pour être entendue partout. Trouve-moi sur ta plateforme favorite!",
    ],
    
    // Collaborations
    collaborations: [
      "J'ai eu l'honneur de collaborer avec Serigne Diagne à la trompette - un musicien extraordinaire! 🎺 Sa technique est impeccable.",
      "Mes collaborations reflètent l'essence de ma musique: authenticité, harmonie, et excellence musicale.",
      "La musique c'est mieux quand on joue ensemble. Chaque collaboration m'apprend quelque chose de nouveau.",
    ],
    
    // Genre & Style
    genre: [
      "Mon style c'est reggae-pop avec des touches de soul et jazz fusion. C'est un mélange unique qui raconte des histoires.",
      "J'aime briser les frontières entre les genres. Reggae, pop, soul, jazz - tout peut vivre ensemble en harmonie! 🎵",
      "Ma musique c'est de la poésie musicale - chaque note a un sens, chaque parole a une âme.",
    ],
    
    // Contact & Bookings
    contact: [
      "Pour les demandes de performances, collaborations, ou juste pour discuter, visite ma page 'Connect'. J'aimerais t'entendre! 💌",
      "Tu peux me contacter via le formulaire de contact ou sur mes réseaux sociaux. Je réponds toujours!",
      "Les bookings pour événements, festivals, ou projets spéciaux? Écris-moi directement - je suis ouverte aux opportunités!",
    ],
    
    // Paris & Location
    paris: [
      "Paris est ma ville, mon inspiration, mon cœur musical. La capitale respire l'art et la créativité. 🇫🇷",
      "Basée à Paris, j'aime mélanger l'ambiance parisienne avec les rythmes caribéens. C'est un contraste beau!",
      "Paris m'a acceptée comme artiste. C'est ici que ma musique a trouvé sa voix.",
    ],
    
    // Inspirations
    inspirations: [
      "Je m'inspire de la vie, des gens que je rencontre, et de la beauté du monde. Chaque expérience devient une chanson.",
      "Les grands artistes comme Youssou Ndour, Alpha Blondy, et des musiciens de jazz m'inspirent énormément.",
      "La nature, l'amour, la douleur, la joie - tout cela nourrit ma créativité musicale.",
    ],
    
    // Performances & Tours
    performances: [
      "J'aime performer en live! L'énergie du public, la connexion humaine - c'est la raison pour laquelle je fais de la musique.",
      "Mes concerts sont des expériences immersives où la musique rencontre l'émotion pure.",
      "Chaque performance est unique - c'est un moment sacré entre moi et toi.",
    ],
    
    // Default/Fallback
    default: [
      "C'est une bonne question! 🤔 Dis-moi plus - je suis là pour discuter de musique, de vie, ou de ce que tu veux!",
      "Intéressant! J'aime parler de tout. Qu'est-ce qui t'intéresse vraiment?",
      "Tu me poses une question que je n'avais pas entendue avant! Mais je suis ici pour échanger. Raconte-moi plus! 🎵",
      "Hmm, c'est une réflexion profonde. Ma musique parle souvent de ces choses-là. Qu'en penses-tu?",
    ],
  };

  // ========================================================================
  // HELPER: Keyword matching
  // ========================================================================

  function selectMockResponse(message) {
    const lower = message.toLowerCase();
    
    // Greetings
    if (/\b(salut|bonjour|hey|coucou|hello|hi)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.greetings);
    }
    
    // About artist
    if (/\b(qui es-tu|qui êtes-vous|about you|raconte|présent|biography)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.aboutArtist);
    }
    
    // Albums
    if (/\b(album|chanson|song|musique|élévation|s-moi|discography)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.albums);
    }
    
    // Streaming platforms
    if (/\b(spotify|apple|youtube|deezer|soundcloud|streaming|écouter|listen)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.streaming);
    }
    
    // Collaborations
    if (/\b(collabor|serigne|trumpet|musician|feature|avec)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.collaborations);
    }
    
    // Genre/Style
    if (/\b(reggae|pop|soul|jazz|fusion|genre|style|son)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.genre);
    }
    
    // Contact/Booking
    if (/\b(contact|booking|event|performance|collabor|reach|email|message)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.contact);
    }
    
    // Paris
    if (/\b(paris|france|french|city|home|basé|based)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.paris);
    }
    
    // Inspirations
    if (/\b(inspir|passion|creative|creation|influence|dream)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.inspirations);
    }
    
    // Live/Performance
    if (/\b(live|concert|performance|tour|stage|show|perform)\b/.test(lower)) {
      return getRandomItem(MOCK_RESPONSES.performances);
    }
    
    // Default
    return getRandomItem(MOCK_RESPONSES.default);
  }

  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // ========================================================================
  // STORAGE & PERSISTENCE
  // ========================================================================

  function loadMessages() {
    try {
      const stored = localStorage.getItem('fan-chat-messages');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load messages:', e);
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      const json = JSON.stringify(messages);
      if (json.length > CONFIG.maxStorageSize) {
        // Remove oldest messages if too large
        messages = messages.slice(-CONFIG.maxMessages);
      }
      localStorage.setItem('fan-chat-messages', json);
    } catch (e) {
      console.warn('Failed to save messages:', e);
    }
  }

  function clearMessages() {
    localStorage.removeItem('fan-chat-messages');
  }

  // ========================================================================
  // UI COMPONENTS
  // ========================================================================

  function createWidgetHTML() {
    return `
      <div id="fan-chat-widget" class="fan-chat-widget" data-theme="${CONFIG.theme}">
        <!-- Chat Button (Closed State) -->
        <div id="fan-chat-button" class="fan-chat-button" title="Chat with ${CONFIG.artistName}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="fan-chat-badge">1</span>
        </div>

        <!-- Chat Window (Hidden by default) -->
        <div id="fan-chat-window" class="fan-chat-window hidden">
          <!-- Header -->
          <div class="fan-chat-header">
            <div class="fan-chat-artist-info">
              <h2>${CONFIG.artistName}</h2>
              <p>💬 Online</p>
            </div>
            <button id="fan-chat-close" class="fan-chat-close" aria-label="Close chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Messages Area -->
          <div id="fan-chat-messages" class="fan-chat-messages"></div>

          <!-- Input Area -->
          <div class="fan-chat-input-area">
            <input 
              id="fan-chat-input" 
              type="text" 
              class="fan-chat-input" 
              placeholder="Message ${CONFIG.artistName}..."
              maxlength="1000"
              autocomplete="off"
            />
            <button id="fan-chat-send" class="fan-chat-send" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          <!-- Footer -->
          <div class="fan-chat-footer">
            <small>🚀 DEMO MODE (No API) | Responses are simulated</small>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================================================
  // MESSAGE RENDERING
  // ========================================================================

  function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `fan-chat-message ${message.role}`;
    
    const content = document.createElement('div');
    content.className = 'fan-chat-message-content';
    content.textContent = message.content; // XSS safe
    
    div.appendChild(content);
    return div;
  }

  function addMessageToUI(message) {
    const messagesContainer = document.getElementById('fan-chat-messages');
    if (!messagesContainer) return;

    const element = createMessageElement(message);
    messagesContainer.appendChild(element);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }

  function renderAllMessages(messages) {
    const container = document.getElementById('fan-chat-messages');
    if (!container) return;

    container.innerHTML = '';
    messages.forEach(msg => addMessageToUI(msg));
  }

  function showTypingIndicator() {
    const container = document.getElementById('fan-chat-messages');
    if (!container) return;

    const typing = document.createElement('div');
    typing.id = 'fan-chat-typing';
    typing.className = 'fan-chat-message assistant';
    typing.innerHTML = `
      <div class="fan-chat-message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('fan-chat-typing');
    if (typing) typing.remove();
  }

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  function handleSendMessage(text) {
    if (!text.trim()) return;

    // Validate
    if (text.length > 1000) {
      alert('Message too long (max 1000 characters)');
      return;
    }

    // Create user message
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Add to UI
    addMessageToUI(userMessage);

    // Save to storage
    const messages = loadMessages();
    messages.push(userMessage);
    saveMessages(messages);

    // Clear input
    const input = document.getElementById('fan-chat-input');
    if (input) input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate response delay
    setTimeout(() => {
      removeTypingIndicator();

      // Get mock response
      const responseText = selectMockResponse(text);
      
      // Create assistant message
      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };

      // Add to UI
      addMessageToUI(assistantMessage);

      // Save to storage
      const updatedMessages = loadMessages();
      updatedMessages.push(assistantMessage);
      
      // Keep only last N messages
      if (updatedMessages.length > CONFIG.maxMessages) {
        updatedMessages.splice(0, updatedMessages.length - CONFIG.maxMessages);
      }
      
      saveMessages(updatedMessages);
    }, CONFIG.responseDelay);
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  function setupEventListeners() {
    const button = document.getElementById('fan-chat-button');
    const closeBtn = document.getElementById('fan-chat-close');
    const sendBtn = document.getElementById('fan-chat-send');
    const input = document.getElementById('fan-chat-input');
    const window_ = document.getElementById('fan-chat-window');

    if (button) {
      button.addEventListener('click', () => {
        window_.classList.toggle('hidden');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window_.classList.add('hidden');
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const text = input.value;
        handleSendMessage(text);
      });
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const text = input.value;
          handleSendMessage(text);
        }
      });
    }
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function init() {
    // Prevent duplicate widgets
    if (document.getElementById('fan-chat-widget')) {
      console.warn('Fan-chat widget already initialized');
      return;
    }

    // Create DOM
    const container = document.createElement('div');
    container.innerHTML = createWidgetHTML();
    document.body.appendChild(container);

    // Setup events
    setupEventListeners();

    // Load previous messages
    const messages = loadMessages();
    if (messages.length > 0) {
      renderAllMessages(messages);
      document.getElementById('fan-chat-window').classList.remove('hidden');
    }

    console.log('✅ Fan-chat demo widget initialized (No API required)');
  }

  // ========================================================================
  // INITIALIZATION TRIGGER
  // ========================================================================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
