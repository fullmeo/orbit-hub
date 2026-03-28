/**
 * Platform Tracking - Google Analytics 4 Event Tracking
 * Complete platform link click tracking for Allyson Glado ORBIT hub
 * Tracks all 7 streaming + social platforms with GA4 integration
 */

// GA4 Configuration
const GA4_CONFIG = {
  MEASUREMENT_ID: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
  PLATFORMS: {
    spotify: { name: 'Spotify', type: 'streaming' },
    apple_music: { name: 'Apple Music', type: 'streaming' },
    youtube: { name: 'YouTube', type: 'streaming' },
    deezer: { name: 'Deezer', type: 'streaming' },
    soundcloud: { name: 'SoundCloud', type: 'streaming' },
    instagram: { name: 'Instagram', type: 'social' },
    facebook: { name: 'Facebook', type: 'social' }
  }
};

/**
 * Track platform click with full context
 */
function trackPlatformClick(platform, contextData = {}) {
  try {
    const platformConfig = GA4_CONFIG.PLATFORMS[platform] || {};

    const eventData = {
      platform: platform,
      platform_name: platformConfig.name || platform,
      platform_type: platformConfig.type || 'unknown',
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...contextData
    };

    // Send to GA4 via gtag
    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'platform_click', eventData);
    }

    // Development logging
    console.log(`[Platform Tracking] ${platformConfig.name} | Context:`, eventData);
    return true;
  } catch (error) {
    console.error('[Platform Tracking] Error:', error);
    return false;
  }
}

/**
 * Track album interaction
 */
function trackAlbumClick(platform, albumName, source = 'album_card') {
  return trackPlatformClick(platform, {
    album: albumName,
    source: source,
    event_type: 'album_platform_click'
  });
}

/**
 * Initialize all platform link tracking
 */
function initializeTrackingListeners() {
  try {
    // Track all platform links with data-platform attribute
    const platformLinks = document.querySelectorAll('[data-platform]');

    platformLinks.forEach((link) => {
      link.addEventListener('click', function(e) {
        const platform = this.getAttribute('data-platform');
        const album = this.getAttribute('data-album') || 'unknown';
        const clickType = this.getAttribute('data-click-type') || 'click';

        // Determine source context
        let source = 'direct';
        if (this.closest('.album-card')) {
          source = 'album_card';
        } else if (this.closest('.album-platforms')) {
          source = 'album_detail_page';
        } else if (this.closest('.platform-buttons')) {
          source = 'hero_section';
        } else if (this.closest('.social-buttons')) {
          source = 'social_section';
        } else if (this.closest('.platform-links')) {
          source = 'album_card_links';
        }

        trackPlatformClick(platform, {
          album: album,
          source: source,
          click_type: clickType
        });
      });
    });

    console.log('[Tracking] Initialized event listeners for all platform links');
  } catch (error) {
    console.error('[Tracking] Error initializing listeners:', error);
  }
}

/**
 * Track social media follows
 */
function trackSocialFollow(platform) {
  return trackPlatformClick(platform, {
    event_type: 'social_follow',
    source: 'social_section'
  });
}

/**
 * Track email signup
 */
function trackEmailSignup(email = '') {
  try {
    const eventData = {
      event_type: 'email_signup',
      email_domain: email ? email.split('@')[1] : 'unknown',
      page: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'email_signup', eventData);
    }

    console.log('[Email Signup Tracking] Event recorded');
    return true;
  } catch (error) {
    console.error('[Email Signup Tracking] Error:', error);
    return false;
  }
}

/**
 * Track page view with custom context
 */
function trackPageView(pageType = 'unknown') {
  try {
    const eventData = {
      page_type: pageType,
      page_title: document.title,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', eventData);
    }

    console.log(`[Page View] ${pageType} | ${document.title}`);
    return true;
  } catch (error) {
    console.error('[Page View Tracking] Error:', error);
    return false;
  }
}

/**
 * Track scroll depth
 */
function trackScrollDepth() {
  let previousScrollPercentage = 0;

  window.addEventListener('scroll', function() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY;
    const scrollPercentage = Math.round((scrollTop / docHeight) * 100);

    // Track at 25%, 50%, 75%, 100%
    const thresholds = [25, 50, 75, 100];
    thresholds.forEach(threshold => {
      if (scrollPercentage >= threshold && previousScrollPercentage < threshold) {
        try {
          if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', 'scroll_depth', {
              scroll_percentage: threshold,
              page: window.location.pathname
            });
          }
          console.log(`[Scroll Tracking] ${threshold}% reached`);
        } catch (error) {
          console.error('[Scroll Tracking] Error:', error);
        }
      }
    });

    previousScrollPercentage = scrollPercentage;
  });
}

/**
 * Track time on page
 */
function trackTimeOnPage() {
  const pageStartTime = Date.now();

  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

    try {
      if (window.gtag && typeof window.gtag === 'function') {
        window.gtag('event', 'time_on_page', {
          time_seconds: timeOnPage,
          page: window.location.pathname
        });
      }
      console.log(`[Time Tracking] Time on page: ${timeOnPage}s`);
    } catch (error) {
      console.error('[Time Tracking] Error:', error);
    }
  });
}

/**
 * Setup email form tracking
 */
function setupEmailFormTracking() {
  const emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function(e) {
      const emailInput = document.getElementById('email-input');
      if (emailInput && emailInput.value) {
        trackEmailSignup(emailInput.value);
      }
    });
  }
}

/**
 * Initialize all tracking on page load
 */
function initializeAllTracking() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeAllTrackingOnReady();
    });
  } else {
    initializeAllTrackingOnReady();
  }
}

function initializeAllTrackingOnReady() {
  // Determine page type
  let pageType = 'unknown';
  if (window.location.pathname.includes('/music')) {
    pageType = 'music_page';
  } else if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    pageType = 'homepage';
  }

  // Initialize all tracking components
  trackPageView(pageType);
  initializeTrackingListeners();
  setupEmailFormTracking();
  trackScrollDepth();
  trackTimeOnPage();

  console.log('[Tracking System] Fully initialized on page:', window.location.pathname);
}

// Start initialization
initializeAllTracking();

// Export functions for manual use
window.platformTracking = {
  trackPlatformClick,
  trackAlbumClick,
  trackSocialFollow,
  trackEmailSignup,
  trackPageView
};
