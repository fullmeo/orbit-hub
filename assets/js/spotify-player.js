/**
 * Spotify Web Playback SDK Integration
 * Handles Spotify player initialization and playback control
 */

// Spotify SDK Configuration
const SPOTIFY_CONFIG = {
  CLIENT_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with actual Spotify Client ID
  REDIRECT_URI: window.location.origin + '/callback',
  SCOPES: [
    'streaming',
    'user-read-private',
    'user-read-email'
  ]
};

/**
 * Get access token from URL hash (after redirect from Spotify auth)
 * @returns {string|null} Access token if available
 */
function getAccessTokenFromHash() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

/**
 * Build Spotify authorization URL
 * @returns {string} Authorization URL
 */
function getSpotifyAuthUrl() {
  const params = new URLSearchParams();
  params.append('client_id', SPOTIFY_CONFIG.CLIENT_ID);
  params.append('response_type', 'token');
  params.append('redirect_uri', SPOTIFY_CONFIG.REDIRECT_URI);
  params.append('scope', SPOTIFY_CONFIG.SCOPES.join(' '));
  params.append('show_dialog', 'true');

  return 'https://accounts.spotify.com/authorize?' + params.toString();
}

/**
 * Spotify Web Playback SDK Player
 */
class SpotifyPlayer {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.player = null;
    this.deviceId = null;
    this.isInitialized = false;

    if (accessToken) {
      this.init();
    }
  }

  /**
   * Initialize the Spotify Web Playback SDK
   */
  init() {
    try {
      // Check if Spotify SDK is loaded
      if (!window.Spotify) {
        console.warn('[Spotify Player] Spotify SDK not loaded');
        return;
      }

      this.player = new Spotify.Player({
        name: 'Allyson Glado - ORBIT Player',
        getOAuthToken: (callback) => {
          callback(this.accessToken);
        }
      });

      // Event listeners
      this.setupEventListeners();

      // Connect to Spotify
      this.player.connect().then((success) => {
        if (success) {
          this.isInitialized = true;
          console.log('[Spotify Player] Connected successfully');
        } else {
          console.error('[Spotify Player] Failed to connect');
        }
      });
    } catch (error) {
      console.error('[Spotify Player] Initialization error:', error);
    }
  }

  /**
   * Setup event listeners for player
   */
  setupEventListeners() {
    if (!this.player) return;

    // Player state changes
    this.player.addListener('player_state_changed', (state) => {
      if (!state) {
        console.log('[Spotify Player] Not playing');
        return;
      }

      const current = state.track_window.current_track;
      const trackUri = current.uri;

      console.log('[Spotify Player] Track:', current.name, 'by', current.artists[0].name);
      this.updatePlayerUI(current, state);
    });

    // Device ready
    this.player.addListener('ready', ({ device_id }) => {
      this.deviceId = device_id;
      console.log('[Spotify Player] Device ID:', device_id);
    });

    // Errors
    this.player.addListener('authentication_error', ({ message }) => {
      console.error('[Spotify Player] Authentication error:', message);
      this.handleAuthError();
    });

    this.player.addListener('account_error', ({ message }) => {
      console.error('[Spotify Player] Account error:', message);
    });

    this.player.addListener('playback_error', ({ message }) => {
      console.error('[Spotify Player] Playback error:', message);
    });
  }

  /**
   * Update player UI with current track info
   * @param {object} track - Current track object
   * @param {object} state - Player state object
   */
  updatePlayerUI(track, state) {
    try {
      const playerUI = document.getElementById('spotify-player');
      if (!playerUI) return;

      const isPlaying = !state.paused;
      const progress = state.position;
      const duration = track.duration_ms;

      // Update track info
      const trackName = document.querySelector('[data-track-name]');
      const artistName = document.querySelector('[data-artist-name]');
      const albumImage = document.querySelector('[data-album-image]');

      if (trackName) trackName.textContent = track.name;
      if (artistName) artistName.textContent = track.artists[0].name;
      if (albumImage && track.album.images.length > 0) {
        albumImage.src = track.album.images[0].url;
      }

      // Update progress bar
      const progressBar = document.querySelector('[data-progress-bar]');
      if (progressBar) {
        progressBar.style.width = ((progress / duration) * 100) + '%';
      }

      // Update play/pause button
      const playButton = document.querySelector('[data-play-button]');
      if (playButton) {
        playButton.classList.toggle('playing', isPlaying);
      }

      console.log('[Spotify Player] UI updated');
    } catch (error) {
      console.error('[Spotify Player] UI update error:', error);
    }
  }

  /**
   * Play a Spotify URI (album, track, playlist)
   * @param {string} spotifyUri - Spotify URI (spotify:album:, spotify:track:, etc.)
   */
  play(spotifyUri) {
    if (!this.isInitialized || !this.deviceId) {
      console.warn('[Spotify Player] Player not ready');
      return;
    }

    try {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: spotifyUri }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.accessToken
        }
      })
        .then(() => {
          console.log('[Spotify Player] Playing:', spotifyUri);
          trackAlbumInteraction(spotifyUri, 'play');
        })
        .catch((error) => {
          console.error('[Spotify Player] Play error:', error);
        });
    } catch (error) {
      console.error('[Spotify Player] Play error:', error);
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (!this.player) return;
    this.player.togglePlay();
  }

  /**
   * Skip to next track
   */
  skipNext() {
    if (!this.player) return;
    this.player.nextTrack();
  }

  /**
   * Skip to previous track
   */
  skipPrev() {
    if (!this.player) return;
    this.player.previousTrack();
  }

  /**
   * Set volume (0-100)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    if (!this.player) return;
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
    this.player.setVolume(normalizedVolume);
  }

  /**
   * Handle authentication error
   */
  handleAuthError() {
    console.error('[Spotify Player] Auth failed, redirecting to login');
    window.location.href = getSpotifyAuthUrl();
  }

  /**
   * Get current device ID
   * @returns {string|null} Device ID
   */
  getDeviceId() {
    return this.deviceId;
  }

  /**
   * Check if player is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }
}

// Global player instance
let spotifyPlayer = null;

/**
 * Initialize Spotify Player
 */
function initSpotifyPlayer() {
  try {
    // Check for access token
    const accessToken = getAccessTokenFromHash();

    if (accessToken) {
      // Remove token from URL for security
      window.location.hash = '';

      // Initialize player
      spotifyPlayer = new SpotifyPlayer(accessToken);

      console.log('[Spotify Player] Initialized with access token');
    } else {
      console.log('[Spotify Player] No access token found');
      // Show login button if player controls are needed
      const playerControls = document.querySelector('[data-spotify-controls]');
      if (playerControls) {
        const loginButton = document.createElement('button');
        loginButton.className = 'btn btn-spotify';
        loginButton.textContent = 'Connect Spotify Player';
        loginButton.onclick = () => {
          window.location.href = getSpotifyAuthUrl();
        };
        playerControls.appendChild(loginButton);
      }
    }
  } catch (error) {
    console.error('[Spotify Player] Initialization error:', error);
  }
}

/**
 * Setup event handlers for player controls
 */
function setupPlayerControls() {
  try {
    // Play button
    const playButton = document.querySelector('[data-play-button]');
    if (playButton) {
      playButton.addEventListener('click', () => {
        if (spotifyPlayer) {
          spotifyPlayer.togglePlayPause();
        }
      });
    }

    // Next button
    const nextButton = document.querySelector('[data-next-button]');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (spotifyPlayer) {
          spotifyPlayer.skipNext();
        }
      });
    }

    // Previous button
    const prevButton = document.querySelector('[data-prev-button]');
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (spotifyPlayer) {
          spotifyPlayer.skipPrev();
        }
      });
    }

    // Volume slider
    const volumeSlider = document.querySelector('[data-volume]');
    if (volumeSlider) {
      volumeSlider.addEventListener('change', (e) => {
        if (spotifyPlayer) {
          spotifyPlayer.setVolume(e.target.value);
        }
      });
    }

    console.log('[Spotify Player] Controls setup complete');
  } catch (error) {
    console.error('[Spotify Player] Controls setup error:', error);
  }
}

/**
 * Play album from button
 * @param {string} albumUri - Spotify album URI
 */
function playAlbum(albumUri) {
  if (!spotifyPlayer || !spotifyPlayer.isReady()) {
    console.warn('[Spotify Player] Player not ready');
    // Fallback to Spotify link
    return true;
  }

  spotifyPlayer.play(albumUri);
  return false; // Prevent link navigation
}

/**
 * Wait for Spotify SDK to load, then initialize
 */
function waitForSpotifySDK() {
  const maxAttempts = 30;
  let attempts = 0;

  const checkInterval = setInterval(() => {
    if (window.Spotify && window.Spotify.Player) {
      clearInterval(checkInterval);
      initSpotifyPlayer();
      setupPlayerControls();
      console.log('[Spotify Player] SDK loaded and player initialized');
    }

    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.warn('[Spotify Player] SDK failed to load after 30 seconds');
      console.log('[Spotify Player] Falling back to Spotify embeds');
    }
  }, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForSpotifySDK);
} else {
  waitForSpotifySDK();
}

// Export for global use
window.SpotifyPlayer = SpotifyPlayer;
window.spotifyPlayer = spotifyPlayer;
window.playAlbum = playAlbum;
window.initSpotifyPlayer = initSpotifyPlayer;
