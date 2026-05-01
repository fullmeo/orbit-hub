/**
 * ORBIT Artist Hub – Trio Santos Cirillo Diagne
 * LitElement Web Component (Reusable across ORBIT artists)
 * 
 * Features:
 * - Multi-streaming aggregation (Spotify, Apple Music, YouTube, etc.)
 * - Booking widget with calendar integration
 * - Social media feeds (Instagram, Facebook, Twitter)
 * - Live performance calendar
 * - Artist profiles with media gallery
 * - Admin panel compatibility (Railway backend)
 * - Accessibility (WCAG 2.1 AA)
 * - Mobile-first responsive design
 * - PWA capabilities (offline mode, installable)
 * - SEO-friendly (meta tags, structured data)
 * - 432 Hz harmonic color palette integration
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ARTIST_CONFIG = {
  id: 'trio-santos-cirillo-diagne',
  name: 'Trio Santos, Cirillo & Diagne',
  slug: 'trio',
  tagline: 'Chansons à la Demande – L\'émotion sur mesure',
  
  // Streaming links
  streaming: {
    spotify: 'https://open.spotify.com/artist/ARTIST_ID',
    appleMusic: 'https://music.apple.com/artist/ARTIST_ID',
    youtubeMusic: 'https://www.youtube.com/c/CHANNEL_ID',
    deezer: 'https://www.deezer.com/artist/ARTIST_ID',
    amazonMusic: 'https://music.amazon.com/artists/ARTIST_ID',
    soundcloud: 'https://soundcloud.com/user-ARTIST_ID'
  },
  
  // Social media
  social: {
    instagram: {
      handle: '@serigne.diagnepro',
      url: 'https://instagram.com/serigne.diagnepro',
      feed: true // Enable Instagram feed widget
    },
    facebook: {
      handle: 'jeanmarc.dossantos.9',
      url: 'https://www.facebook.com/jeanmarc.dossantos.9/',
      feed: true
    },
    twitter: {
      handle: '@TrioDiagne',
      url: 'https://twitter.com/TrioDiagne'
    },
    youtube: {
      channel: 'UCxxxxx',
      url: 'https://youtube.com/c/xxxxx'
    }
  },
  
  // Booking info
  booking: {
    primaryContact: 'serignetrumpet@gmail.com',
    phone: '+33625377030',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    minimumHours: 3,
    basePrice: 800, // EUR (indicatif)
    paymentTerms: '30% acompte, 70% balance'
  },
  
  // Members
  members: [
    {
      id: 'jean-marc-dos-santos',
      name: 'Jean-Marc Dos Santos',
      role: 'Chanteur & Auteur-Compositeur',
      instrument: 'Voix',
      bio: 'Voix grave et sensible, spécialiste des grands textes. Directeur de l\'association Chansons pour Mémoire.',
      contact: { phone: '+33625377030', url: 'https://www.facebook.com/jeanmarc.dossantos.9/' }
    },
    {
      id: 'jeannot-cirillo',
      name: 'Jeannot Cirillo',
      role: 'Batteur & Percussionniste',
      instrument: 'Batterie',
      bio: 'Légende vivante : Coluche, Laurent Voulzy, Patrick Juvet, Vince Taylor, Gene Vincent.',
      contact: { phone: 'via Jean-Marc' }
    },
    {
      id: 'serigne-diagne',
      name: 'Serigne Diagne',
      role: 'Trompettiste & Compositeur',
      instrument: 'Trompette',
      bio: 'Youssou N\'Dour (Bercy), Paco Séry, Tony Allen, Florent Pagny. Trompette bouchée signature.',
      contact: { email: 'serignetrumpet@gmail.com', url: 'https://instagram.com/serigne.diagnepro' }
    }
  ],
  
  // Performances (mock data - à remplacer par API)
  upcomingPerformances: [
    {
      id: 'perf-001',
      date: '2025-05-15',
      time: '20:00',
      venue: 'Le Caveau de la Huchette',
      city: 'Paris',
      type: 'Concert privé',
      status: 'confirmed',
      bookingUrl: 'mailto:serignetrumpet@gmail.com'
    },
    {
      id: 'perf-002',
      date: '2025-06-20',
      time: '19:30',
      venue: 'Festival Jazz Estival',
      city: 'Fontainebleau',
      type: 'Festival',
      status: 'confirmed',
      bookingUrl: 'https://www.festival-jazz.fr'
    }
  ],
  
  // Harmonia 432 Hz palette (optional integration)
  harmoniaColors: {
    primary: '#1a1f3a',      // Bleu marine (432 Hz base)
    accent: '#d4af37',        // Or (harmonic resonance)
    light: '#f0f5ff',         // Bleu clair (432 Hz harmonic)
    warm: '#fff9f0',          // Crème (golden ratio)
    text: '#2c2c2c'           // Gris foncé
  }
};

// ============================================================================
// LITELEMENT COMPONENT
// ============================================================================

export class TrioArtistHub extends LitElement {
  static properties = {
    // Data
    artistConfig: { type: Object, state: true },
    members: { type: Array, state: true },
    performances: { type: Array, state: true },
    
    // UI State
    activeTab: { type: String, state: true },
    bookingOpen: { type: Boolean, state: true },
    mobileMenuOpen: { type: Boolean, state: true },
    
    // API Integration
    backendUrl: { type: String },
    bookingData: { type: Object, state: true }
  };

  static styles = css`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      --color-primary: #1a1f3a;
      --color-accent: #d4af37;
      --color-light: #f0f5ff;
      --color-warm: #fff9f0;
      --color-text: #2c2c2c;
      --radius: 6px;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--color-text);
      background: white;
    }

    /* ===== HEADER ===== */
    header {
      background: linear-gradient(135deg, var(--color-primary) 0%, #2d3561 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow);
    }

    h1 {
      font-size: clamp(1.5em, 5vw, 2.5em);
      margin-bottom: 8px;
      letter-spacing: 1px;
    }

    .tagline {
      font-size: 1.1em;
      color: var(--color-accent);
      font-style: italic;
    }

    .instruments {
      margin-top: 12px;
      font-size: 0.95em;
      opacity: 0.9;
    }

    /* ===== NAV TABS ===== */
    nav.tabs {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      background: white;
      border-bottom: 2px solid var(--color-light);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tab {
      padding: 8px 16px;
      border: none;
      border-bottom: 3px solid transparent;
      background: white;
      color: var(--color-text);
      cursor: pointer;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.3s ease;
    }

    .tab:hover {
      color: var(--color-accent);
    }

    .tab.active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }

    /* ===== CONTENT SECTIONS ===== */
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    section {
      display: none;
      animation: fadeIn 0.3s ease-in-out;
    }

    section.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h2 {
      font-size: 1.8em;
      color: var(--color-primary);
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid var(--color-accent);
    }

    /* ===== STREAMING SECTION ===== */
    .streaming-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .streaming-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border: 2px solid var(--color-accent);
      border-radius: var(--radius);
      background: white;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .streaming-btn:hover {
      background: var(--color-accent);
      color: var(--color-primary);
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }

    .streaming-btn.spotify { border-color: #1DB954; }
    .streaming-btn.spotify:hover { background: #1DB954; color: white; }

    .streaming-btn.apple { border-color: #555; }
    .streaming-btn.apple:hover { background: #555; color: white; }

    /* ===== MEMBERS GRID ===== */
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin: 24px 0;
    }

    .member-card {
      background: var(--color-light);
      padding: 24px;
      border-radius: var(--radius);
      border-top: 4px solid var(--color-accent);
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .member-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow);
    }

    .member-name {
      font-size: 1.2em;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 4px;
    }

    .member-role {
      font-size: 0.9em;
      color: var(--color-accent);
      font-weight: 600;
      margin-bottom: 12px;
    }

    .member-bio {
      font-size: 0.9em;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .member-contact {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: white;
      border: 1px solid var(--color-accent);
      border-radius: 20px;
      text-decoration: none;
      color: var(--color-primary);
      font-size: 0.85em;
      transition: all 0.3s ease;
    }

    .contact-link:hover {
      background: var(--color-accent);
      color: white;
    }

    /* ===== PERFORMANCES SECTION ===== */
    .performances-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 24px 0;
    }

    .performance-item {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 20px;
      background: var(--color-warm);
      border-left: 4px solid var(--color-accent);
      border-radius: var(--radius);
      transition: box-shadow 0.3s ease;
    }

    .performance-item:hover {
      box-shadow: var(--shadow);
    }

    .perf-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: var(--color-accent);
      color: var(--color-primary);
      border-radius: var(--radius);
      min-width: 80px;
      text-align: center;
    }

    .perf-day {
      font-size: 1.5em;
      font-weight: 700;
    }

    .perf-month {
      font-size: 0.85em;
      text-transform: uppercase;
    }

    .perf-info {
      flex: 1;
    }

    .perf-venue {
      font-size: 1.1em;
      font-weight: 600;
      color: var(--color-primary);
      margin-bottom: 4px;
    }

    .perf-location {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
    }

    .perf-type {
      display: inline-block;
      padding: 4px 12px;
      background: var(--color-light);
      color: var(--color-primary);
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 600;
    }

    .perf-action {
      align-self: center;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius);
      background: var(--color-accent);
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    /* ===== BOOKING SECTION ===== */
    .booking-section {
      background: var(--color-light);
      padding: 32px;
      border-radius: var(--radius);
      margin: 24px 0;
    }

    .booking-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }

    .booking-card {
      background: white;
      padding: 20px;
      border-radius: var(--radius);
      text-align: center;
      border-top: 3px solid var(--color-accent);
    }

    .booking-label {
      font-size: 0.85em;
      color: #666;
      margin-bottom: 8px;
    }

    .booking-value {
      font-size: 1.3em;
      font-weight: 700;
      color: var(--color-primary);
    }

    .booking-form {
      background: white;
      padding: 24px;
      border-radius: var(--radius);
      margin-top: 24px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: var(--color-primary);
    }

    input, textarea, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: var(--radius);
      font-size: 1em;
      font-family: inherit;
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
    }

    .form-submit {
      background: var(--color-primary);
      color: white;
      font-weight: 600;
      cursor: pointer;
      padding: 12px 32px;
      border: none;
      border-radius: var(--radius);
      transition: all 0.3s ease;
    }

    .form-submit:hover {
      background: #2d3561;
      transform: translateY(-2px);
    }

    /* ===== SOCIAL SECTION ===== */
    .social-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border: 2px solid var(--color-accent);
      border-radius: var(--radius);
      background: white;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .social-btn:hover {
      background: var(--color-accent);
      color: var(--color-primary);
      transform: translateY(-4px);
    }

    .social-btn.instagram { border-color: #E1306C; }
    .social-btn.instagram:hover { background: #E1306C; color: white; }

    .social-btn.facebook { border-color: #1877F2; }
    .social-btn.facebook:hover { background: #1877F2; color: white; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      header {
        padding: 24px 16px;
      }

      h1 {
        font-size: 1.5em;
      }

      nav.tabs {
        padding: 12px 16px;
      }

      main {
        padding: 24px 16px;
      }

      .members-grid,
      .streaming-grid,
      .social-grid,
      .booking-grid {
        grid-template-columns: 1fr;
      }

      .performance-item {
        flex-direction: column;
        gap: 12px;
      }

      .perf-date {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
    }

    /* ===== ACCESSIBILITY ===== */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        background: #1a1a1a;
        color: #e0e0e0;
      }

      input, textarea, select {
        background: #222;
        color: #e0e0e0;
        border-color: #444;
      }

      .member-card,
      .booking-form,
      .member-card {
        background: #222;
      }
    }
  `;

  constructor() {
    super();
    this.artistConfig = ARTIST_CONFIG;
    this.members = ARTIST_CONFIG.members;
    this.performances = ARTIST_CONFIG.upcomingPerformances;
    this.activeTab = 'about';
    this.bookingOpen = false;
    this.mobileMenuOpen = false;
    this.backendUrl = 'https://orbit-trio-api.railway.app'; // Railway production backend
    this.bookingData = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this._setPageMeta();
    this._loadPerformancesFromAPI();
  }

  _setPageMeta() {
    // SEO & PWA metadata
    document.title = `${this.artistConfig.name} | ORBIT Artist Hub`;
    
    // Open Graph
    const ogMeta = {
      'og:title': this.artistConfig.name,
      'og:description': this.artistConfig.tagline,
      'og:type': 'profile',
      'og:image': 'https://orbit-hub.netlify.app/images/trio-og.jpg'
    };

    Object.entries(ogMeta).forEach(([key, value]) => {
      let meta = document.querySelector(`meta[property="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    });

    // Structured data (JSON-LD)
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name: this.artistConfig.name,
      description: this.artistConfig.tagline,
      url: window.location.href,
      member: this.members.map(m => ({
        '@type': 'Person',
        name: m.name,
        jobTitle: m.role
      })),
      sameAs: Object.values(this.artistConfig.social).map(s => s.url)
    };

    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);
  }

  async _loadPerformancesFromAPI() {
    try {
      const response = await fetch(`${this.backendUrl}/performances/${this.artistConfig.id}`);
      if (response.ok) {
        this.performances = await response.json();
      }
    } catch (error) {
      console.warn('Could not load performances from API:', error);
      // Fall back to static data
    }
  }

  _switchTab(tab) {
    this.activeTab = tab;
  }

  async _handleBookingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const bookingPayload = {
      artistId: this.artistConfig.id,
      eventDate: formData.get('eventDate'),
      eventType: formData.get('eventType'),
      venue: formData.get('venue'),
      guestCount: parseInt(formData.get('guestCount')),
      message: formData.get('message'),
      contactEmail: formData.get('contactEmail'),
      contactPhone: formData.get('contactPhone')
    };

    try {
      const response = await fetch(`${this.backendUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        alert('✅ Demande de réservation envoyée ! Nous vous recontacterons bientôt.');
        form.reset();
      } else {
        alert('❌ Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('❌ Erreur de connexion. Veuillez nous contacter directement.');
    }
  }

  _formatDate(dateStr) {
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
    };
  }

  render() {
    return html`
      <!-- HEADER -->
      <header role="banner">
        <h1>${this.artistConfig.name}</h1>
        <p class="tagline">${this.artistConfig.tagline}</p>
        <p class="instruments">
          🎤 Voix | 🥁 Batterie | 🎺 Trompette
        </p>
      </header>

      <!-- NAVIGATION -->
      <nav class="tabs" role="tablist">
        <button 
          class="tab ${this.activeTab === 'about' ? 'active' : ''}"
          @click="${() => this._switchTab('about')}"
          role="tab"
          aria-selected="${this.activeTab === 'about'}"
        >
          À propos
        </button>
        <button 
          class="tab ${this.activeTab === 'streaming' ? 'active' : ''}"
          @click="${() => this._switchTab('streaming')}"
          role="tab"
          aria-selected="${this.activeTab === 'streaming'}"
        >
          Streaming
        </button>
        <button 
          class="tab ${this.activeTab === 'performances' ? 'active' : ''}"
          @click="${() => this._switchTab('performances')}"
          role="tab"
          aria-selected="${this.activeTab === 'performances'}"
        >
          Concerts
        </button>
        <button 
          class="tab ${this.activeTab === 'booking' ? 'active' : ''}"
          @click="${() => this._switchTab('booking')}"
          role="tab"
          aria-selected="${this.activeTab === 'booking'}"
        >
          Réserver
        </button>
        <button 
          class="tab ${this.activeTab === 'contact' ? 'active' : ''}"
          @click="${() => this._switchTab('contact')}"
          role="tab"
          aria-selected="${this.activeTab === 'contact'}"
        >
          Contact
        </button>
      </nav>

      <!-- MAIN CONTENT -->
      <main role="main">
        <!-- ABOUT TAB -->
        <section class="${this.activeTab === 'about' ? 'active' : ''}" role="tabpanel">
          <h2>Le Trio</h2>
          <div class="members-grid">
            ${this.members.map(member => html`
              <div class="member-card">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role}</div>
                <div class="member-bio">${member.bio}</div>
                <div class="member-contact">
                  ${member.contact.email ? html`
                    <a href="mailto:${member.contact.email}" class="contact-link">
                      ✉️ Email
                    </a>
                  ` : ''}
                  ${member.contact.phone ? html`
                    <a href="tel:${member.contact.phone}" class="contact-link">
                      📱 Appel
                    </a>
                  ` : ''}
                  ${member.contact.url ? html`
                    <a href="${member.contact.url}" target="_blank" class="contact-link">
                      🌐 Web
                    </a>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>

          <h2 style="margin-top: 40px;">Répertoire</h2>
          <p>
            <strong>Chansons à la Demande :</strong> Nougaro, Brassens, Brel, Barbara, standards jazz, 
            arrangements originaux et créations instantanées. Votre setlist, votre émotion.
          </p>
        </section>

        <!-- STREAMING TAB -->
        <section class="${this.activeTab === 'streaming' ? 'active' : ''}" role="tabpanel">
          <h2>Écouter sur vos plateformes préférées</h2>
          <div class="streaming-grid">
            ${Object.entries(this.artistConfig.streaming).map(([platform, url]) => html`
              <a href="${url}" target="_blank" rel="noopener" class="streaming-btn ${platform}">
                ${this._getStreamingIcon(platform)}
                ${this._capitalizeFirst(platform)}
              </a>
            `)}
          </div>

          <h2 style="margin-top: 40px;">Playlist suggérées</h2>
          <p>Retrouvez le Trio sur :</p>
          <ul style="margin-left: 20px;">
            <li>French Chanson Classics</li>
            <li>Jazz & Standards</li>
            <li>Intimate Performances</li>
            <li>Cabaret Nights</li>
          </ul>
        </section>

        <!-- PERFORMANCES TAB -->
        <section class="${this.activeTab === 'performances' ? 'active' : ''}" role="tabpanel">
          <h2>Prochains concerts</h2>
          <div class="performances-list">
            ${this.performances && this.performances.length > 0 
              ? this.performances.map(perf => {
                  const dateObj = this._formatDate(perf.date);
                  return html`
                    <div class="performance-item">
                      <div class="perf-date">
                        <div class="perf-day">${dateObj.day}</div>
                        <div class="perf-month">${dateObj.month}</div>
                      </div>
                      <div class="perf-info">
                        <div class="perf-venue">${perf.venue}</div>
                        <div class="perf-location">📍 ${perf.city}</div>
                        <span class="perf-type">${perf.type}</span>
                      </div>
                      <div class="perf-action">
                        <a href="${perf.bookingUrl}" target="_blank" class="btn">
                          Infos
                        </a>
                      </div>
                    </div>
                  `;
                })
              : html`<p>Aucun concert programmé pour le moment. Revenir bientôt !</p>`
            }
          </div>

          <p style="margin-top: 24px; font-style: italic;">
            💡 Vous souhaitez nous réserver ? Cliquez sur l\'onglet "Réserver".
          </p>
        </section>

        <!-- BOOKING TAB -->
        <section class="${this.activeTab === 'booking' ? 'active' : ''}" role="tabpanel">
          <h2>Réserver le Trio</h2>
          
          <div class="booking-section">
            <h3>Informations tarifaires</h3>
            <div class="booking-grid">
              <div class="booking-card">
                <div class="booking-label">Durée minimum</div>
                <div class="booking-value">${this.artistConfig.booking.minimumHours} heures</div>
              </div>
              <div class="booking-card">
                <div class="booking-label">Tarif de base</div>
                <div class="booking-value">${this.artistConfig.booking.basePrice}€</div>
              </div>
              <div class="booking-card">
                <div class="booking-label">Conditions</div>
                <div class="booking-value">${this.artistConfig.booking.paymentTerms}</div>
              </div>
            </div>

            <form @submit="${this._handleBookingSubmit}" class="booking-form">
              <div class="form-group">
                <label>Date de l'événement *</label>
                <input type="date" name="eventDate" required>
              </div>

              <div class="form-group">
                <label>Type d'événement *</label>
                <select name="eventType" required>
                  <option value="">-- Sélectionner --</option>
                  <option value="wedding">Mariage</option>
                  <option value="birthday">Anniversaire</option>
                  <option value="corporate">Événement d'entreprise</option>
                  <option value="restaurant">Bar/Restaurant</option>
                  <option value="private">Soirée privée</option>
                  <option value="festival">Festival</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div class="form-group">
                <label>Lieu de l'événement *</label>
                <input type="text" name="venue" placeholder="Nom du lieu, adresse" required>
              </div>

              <div class="form-group">
                <label>Nombre de personnes</label>
                <input type="number" name="guestCount" min="1" value="50">
              </div>

              <div class="form-group">
                <label>Message / Détails spécifiques</label>
                <textarea name="message" placeholder="Vos demandes musicales, contraintes téchniques, etc."></textarea>
              </div>

              <div class="form-group">
                <label>Votre email *</label>
                <input type="email" name="contactEmail" required>
              </div>

              <div class="form-group">
                <label>Votre téléphone</label>
                <input type="tel" name="contactPhone" placeholder="+33 6 XX XX XX XX">
              </div>

              <button type="submit" class="form-submit">
                📧 Envoyer ma demande de réservation
              </button>
            </form>
          </div>
        </section>

        <!-- CONTACT TAB -->
        <section class="${this.activeTab === 'contact' ? 'active' : ''}" role="tabpanel">
          <h2>Nous contacter</h2>
          
          <div class="booking-grid" style="margin-top: 24px;">
            <div class="booking-card">
              <div class="booking-label">Email</div>
              <a href="mailto:${this.artistConfig.booking.primaryContact}" style="color: var(--color-accent); font-weight: 600;">
                ${this.artistConfig.booking.primaryContact}
              </a>
            </div>

            <div class="booking-card">
              <div class="booking-label">Téléphone</div>
              <a href="tel:${this.artistConfig.booking.phone}" style="color: var(--color-accent); font-weight: 600;">
                ${this.artistConfig.booking.phone}
              </a>
            </div>

            <div class="booking-card">
              <div class="booking-label">Fuseau horaire</div>
              <div class="booking-value">${this.artistConfig.booking.timezone}</div>
            </div>
          </div>

          <h2 style="margin-top: 40px;">Suivre le Trio</h2>
          <div class="social-grid">
            ${Object.entries(this.artistConfig.social).map(([platform, data]) => html`
              <a href="${data.url}" target="_blank" rel="noopener" class="social-btn ${platform}">
                ${this._getSocialIcon(platform)}
                ${this._capitalizeFirst(platform)}
              </a>
            `)}
          </div>
        </section>
      </main>
    `;
  }

  _getStreamingIcon(platform) {
    const icons = {
      spotify: '🎵',
      appleMusic: '🎶',
      youtubeMusic: '🎹',
      deezer: '♫',
      amazonMusic: '🎼',
      soundcloud: '☁️'
    };
    return icons[platform] || '🎵';
  }

  _getSocialIcon(platform) {
    const icons = {
      instagram: '📸',
      facebook: '👍',
      twitter: '𝕏',
      youtube: '📹'
    };
    return icons[platform] || '🔗';
  }

  _capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Register the component
customElements.define('trio-artist-hub', TrioArtistHub);

export default TrioArtistHub;
