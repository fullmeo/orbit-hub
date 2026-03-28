/**
 * Platform Tracking - Google Analytics 4 Event Tracking
 * Tracks all platform link clicks and user interactions
 */

// Platform tracking configuration
const PLATFORM_CONFIG = {
  MEASUREMENT_ID: 'G-XXXXXXXXXX', // Replace with actual GA4 measurement ID
  PLATFORMS: {
    spotify: { name: 'Spotify', color: '#1DB954' },
    'apple-music': { name: 'Apple Music', color: '#fa243c' },
    youtube: { name: 'YouTube', color: '#FF0000' },
    deezer: { name: 'Deezer', color: '#FF0084' },
    soundcloud: { name: 'SoundCloud', color: '#FF7700' },
    instagram: { name: 'Instagram', color: '#E4405F' },
    facebook: { name: 'Facebook', color: '#1877F2' }
  }
};

/**
 * Track platform click event in GA4
 * @param {string} platform - Platform identifier (e.g., 'spotify', 'apple-music')
 * @param {string} source - Source context (e.g., 'hero_section', 'music_page', 'album_s-moi')
 * @param {object} additionalParams - Optional additional parameters for event
 */
function trackPlatformClick(platform, source = 'unknown', additionalParams = {}) {
  try {
    // Validate platform
    if (!platform || typeof platform !== 'string') {
      console.warn('[Platform Tracking] Invalid platform:', platform);
      return;
    }

    // Get platform config
    const platformConfig = PLATFORM_CONFIG.PLATFORMS[platform.toLowerCase()];
    const platformName = platformConfig?.name || platform;

    // Construct GA4 event object
    const eventData = {
      'event': 'platform_click',
      'platform': platform.toLowerCase(),
      'platform_name': platformName,
      'source': source.toLowerCase(),
      'timestamp': new Date().toISOString(),
      ...additionalParams
    };

    // Send to Google Analytics 4
    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'platform_click', eventData);
      console.log('[Platform Tracking] Event sent:', eventData);
    } else {
      console.warn('[Platform Tracking] GA4 gtag function not available');
    }

    // Log to console for development
    console.log(`[Platform Click] ${platformName} | Source: ${source}`);

    return true;
  } catch (error) {
    console.error('[Platform Tracking] Error tracking click:', error);
    return false;
  }
}

/**
 * Track email signup attempt
 * @param {string} email - Email address (should be hashed/anonymized)
 * @param {string} source - Where the signup came from
 */
function trackEmailSignup(email, source = 'email_form') {
  try {
    const eventData = {
      'event': 'email_signup',
      'email_domain': email ? email.split('@')[1] : 'unknown',
      'source': source.toLowerCase(),
      'timestamp': new Date().toISOString()
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'email_signup', eventData);
      console.log('[Email Signup Tracking] Event sent');
    }

    return true;
  } catch (error) {
    console.error('[Email Signup Tracking] Error:', error);
    return false;
  }
}

/**
 * Track page view with custom parameters
 * @param {string} pageName - Page name/title
 * @param {object} additionalParams - Optional additional parameters
 */
function trackPageView(pageName = document.title, additionalParams = {}) {
  try {
    const eventData = {
      'page_title': pageName,
      'page_path': window.location.pathname,
      'page_url': window.location.href,
      ...additionalParams
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', eventData);
      console.log('[Page View Tracking] Event sent:', pageName);
    }

    return true;
  } catch (error) {
    console.error('[Page View Tracking] Error:', error);
    return false;
  }
}

/**
 * Track album interaction
 * @param {string} albumName - Album name (e.g., 's-moi', 'elevation')
 * @param {string} action - Action type (e.g., 'view', 'click', 'play')
 */
function trackAlbumInteraction(albumName, action = 'view') {
  try {
    const eventData = {
      'event': 'album_interaction',
      'album_name': albumName.toLowerCase(),
      'action': action.toLowerCase(),
      'timestamp': new Date().toISOString()
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'album_interaction', eventData);
      console.log('[Album Tracking] Event sent:', { album: albumName, action });
    }

    return true;
  } catch (error) {
    console.error('[Album Tracking] Error:', error);
    return false;
  }
}

/**
 * Track outbound link click
 * @param {string} url - Destination URL
 * @param {string} linkText - Link text or label
 * @param {string} category - Link category
 */
function trackOutboundLink(url, linkText = 'link', category = 'outbound') {
  try {
    const eventData = {
      'event': 'click',
      'link_url': url,
      'link_text': linkText,
      'link_category': category.toLowerCase()
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'click', eventData);
      console.log('[Outbound Link Tracking] Event sent:', url);
    }

    return true;
  } catch (error) {
    console.error('[Outbound Link Tracking] Error:', error);
    return false;
  }
}

/**
 * Build UTM parameters for platform URLs
 * @param {string} platform - Platform name
 * @param {string} source - Traffic source
 * @param {string} campaign - Campaign name
 * @returns {string} UTM parameter string
 */
function buildUTMParams(platform, source = 'orbit', campaign = 'artist-visibility') {
  const params = new URLSearchParams();
  params.append('utm_source', source);
  params.append('utm_medium', 'platform_link');
  params.append('utm_campaign', campaign);
  params.append('utm_content', platform.toLowerCase());

  return params.toString();
}

/**
 * Add platform link tracking to all platform links on page
 * Should be called on page load
 */
function initPlatformTracking() {
  try {
    // Find all platform links
    const platformLinks = document.querySelectorAll('[class*="platform"]');

    platformLinks.forEach((link) => {
      if (!link.onclick || typeof link.onclick !== 'function') {
        // Add click tracking to links without existing onclick
        link.addEventListener('click', function(e) {
          const platform = this.className.match(/platform-btn-(\w+)|platform[_-](\w+)/);
          if (platform) {
            const platformName = platform[1] || platform[2];
            const source = this.getAttribute('data-source') || 'page_link';
            trackPlatformClick(platformName, source);
          }
        });
      }
    });

    // Find all email signup forms
    const emailForms = document.querySelectorAll('.email-signup form, .email-signup-form');
    emailForms.forEach((form) => {
      form.addEventListener('submit', function(e) {
        const emailInput = this.querySelector('input[type="email"]');
        if (emailInput && emailInput.value) {
          trackEmailSignup(emailInput.value, 'email_form');
        }
      });
    });

    console.log('[Platform Tracking] Initialized - Event listeners added');
    return true;
  } catch (error) {
    console.error('[Platform Tracking] Initialization error:', error);
    return false;
  }
}

/**
 * Track scroll depth
 * Records when user scrolls to certain percentage of page
 */
function trackScrollDepth() {
  let scrollDepthTracked = {
    25: false,
    50: false,
    75: false,
    100: false
  };

  window.addEventListener('scroll', function() {
    try {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollPercent = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );

      // Track milestones
      Object.keys(scrollDepthTracked).forEach((milestone) => {
        if (scrollPercent >= parseInt(milestone) && !scrollDepthTracked[milestone]) {
          scrollDepthTracked[milestone] = true;

          if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', 'scroll_depth', {
              'depth': parseInt(milestone),
              'page': document.title
            });

            console.log(`[Scroll Depth] ${milestone}% reached`);
          }
        }
      });
    } catch (error) {
      console.error('[Scroll Depth Tracking] Error:', error);
    }
  });
}

/**
 * Track time on page
 * Records how long user stays on page
 */
function trackTimeOnPage() {
  const startTime = Date.now();

  window.addEventListener('beforeunload', function() {
    try {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);

      if (window.gtag && typeof window.gtag === 'function') {
        window.gtag('event', 'time_on_page', {
          'duration_seconds': timeOnPage,
          'page': document.title
        });

        console.log(`[Time on Page] ${timeOnPage} seconds`);
      }
    } catch (error) {
      console.error('[Time on Page Tracking] Error:', error);
    }
  });
}

/**
 * Initialize all tracking on page load
 */
function initializeTracking() {
  try {
    // Track page view
    trackPageView();

    // Initialize platform link tracking
    initPlatformTracking();

    // Initialize scroll depth tracking
    trackScrollDepth();

    // Initialize time on page tracking
    trackTimeOnPage();

    console.log('[Tracking] All tracking systems initialized');
  } catch (error) {
    console.error('[Tracking] Initialization error:', error);
  }
}

// Initialize tracking when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTracking);
} else {
  initializeTracking();
}

// Export functions for use in HTML onclick handlers
window.trackPlatformClick = trackPlatformClick;
window.trackEmailSignup = trackEmailSignup;
window.trackPageView = trackPageView;
window.trackAlbumInteraction = trackAlbumInteraction;
window.trackOutboundLink = trackOutboundLink;
