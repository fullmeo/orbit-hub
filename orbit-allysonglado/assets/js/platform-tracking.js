// ========================================================================
// ORBIT - Platform Tracking Script
// Tracks clicks on Spotify, Apple Music, YouTube, etc.
// ========================================================================

class PlatformTracker {
    constructor() {
        this.platforms = {
            spotify: { name: 'Spotify', color: '#1DB954' },
            apple: { name: 'Apple Music', color: '#000' },
            youtube: { name: 'YouTube', color: '#FF0000' },
            deezer: { name: 'Deezer', color: '#0066CC' },
            soundcloud: { name: 'SoundCloud', color: '#FF7700' },
            instagram: { name: 'Instagram', color: '#E4405F' },
            facebook: { name: 'Facebook', color: '#1877F2' },
            tiktok: { name: 'TikTok', color: '#000' }
        };
        
        this.init();
    }

    init() {
        this.setupPlatformTracking();
        this.setupEventTracking();
        console.log('🎵 Platform Tracker initialized');
    }

    /**
     * Setup platform link click tracking
     */
    setupPlatformTracking() {
        const platformLinks = document.querySelectorAll('[data-platform]');
        
        platformLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.trackPlatformClick(e);
            });
        });

        console.log(`✓ Tracking ${platformLinks.length} platform links`);
    }

    /**
     * Track individual platform click
     */
    trackPlatformClick(event) {
        const link = event.currentTarget;
        const platform = link.getAttribute('data-platform');
        const source = link.getAttribute('data-source') || 'unknown';
        const eventType = link.getAttribute('data-event') || 'platform_click';

        const eventData = {
            event: 'platform_click',
            event_category: 'engagement',
            event_label: `${platform}_from_${source}`,
            platform_name: platform,
            source_page: source,
            platform_url: link.href,
            click_type: this.getClickType(event)
        };

        // Send to GA4
        this.sendToGA4(eventData);

        // Log for debugging
        this.logClick(platform, source, eventData);

        // Optional: Send to analytics backend
        this.sendToAnalyticsBackend(eventData);
    }

    /**
     * Setup other event tracking (buttons, forms, etc)
     */
    setupEventTracking() {
        // Track button clicks with data-event attribute
        const buttons = document.querySelectorAll('[data-event]');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const event = btn.getAttribute('data-event');
                this.trackEvent(event, {
                    element: btn.textContent?.trim() || 'button',
                    href: btn.href || 'n/a'
                });
            });
        });

        console.log(`✓ Tracking ${buttons.length} events`);
    }

    /**
     * Generic event tracker
     */
    trackEvent(eventName, data = {}) {
        const eventData = {
            event: eventName,
            event_category: data.category || 'engagement',
            event_label: data.label || eventName,
            ...data
        };

        this.sendToGA4(eventData);
        this.logEvent(eventName, data);
    }

    /**
     * Determine click type (direct, keyboard, touch, etc)
     */
    getClickType(event) {
        if (event.pointerType === 'touch') return 'touch';
        if (event.pointerType === 'pen') return 'pen';
        if (event.type === 'keydown') return 'keyboard';
        return 'mouse';
    }

    /**
     * Send event to Google Analytics 4
     */
    sendToGA4(eventData) {
        if (typeof gtag === 'undefined') {
            console.warn('GA4 not initialized');
            return;
        }

        try {
            gtag('event', eventData.event, {
                'event_category': eventData.event_category,
                'event_label': eventData.event_label,
                'platform_name': eventData.platform_name,
                'source_page': eventData.source_page,
                'click_type': eventData.click_type
            });
        } catch (error) {
            console.error('GA4 tracking error:', error);
        }
    }

    /**
     * Send to custom analytics backend (optional)
     * This can be used alongside GA4
     */
    sendToAnalyticsBackend(eventData) {
        // Example: Send to Netlify Function or custom backend
        /*
        fetch('/.netlify/functions/track-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...eventData,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            })
        }).catch(e => console.error('Analytics backend error:', e));
        */
    }

    /**
     * Logging for development/debugging
     */
    logClick(platform, source, data) {
        const platformInfo = this.platforms[platform];
        console.log(
            `%c🎵 ${platformInfo?.name || platform.toUpperCase()}`,
            `color: ${platformInfo?.color || '#666'}; font-weight: bold;`
        );
        console.log(`  Source: ${source}`);
        console.log(`  URL: ${data.platform_url}`);
        console.log(`  Click Type: ${data.click_type}`);
    }

    logEvent(eventName, data) {
        console.log(`📊 Event: ${eventName}`, data);
    }

    /**
     * Get platform statistics (from GA4 or custom backend)
     * Useful for displaying top platforms
     */
    async getPlatformStats() {
        try {
            const response = await fetch('/.netlify/functions/get-platform-stats');
            const stats = await response.json();
            console.log('Platform statistics:', stats);
            return stats;
        } catch (error) {
            console.error('Failed to fetch platform stats:', error);
            return null;
        }
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let maxScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (currentScroll > maxScroll) {
                maxScroll = currentScroll;
                
                // Track at 25%, 50%, 75%, 100%
                const thresholds = [25, 50, 75, 100];
                thresholds.forEach(threshold => {
                    if (currentScroll >= threshold && currentScroll - 5 < threshold) {
                        this.trackEvent('scroll_depth', {
                            category: 'engagement',
                            label: `scroll_${threshold}percent`,
                            value: Math.round(threshold)
                        });
                    }
                });
            }
        });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            
            if (timeOnPage > 10) { // Only track if user spent more than 10 seconds
                this.trackEvent('time_on_page', {
                    category: 'engagement',
                    value: timeOnPage,
                    label: `${timeOnPage}_seconds`
                });
            }
        });
    }

    /**
     * Track external link clicks (exit tracking)
     */
    trackExternalLinks() {
        const links = document.querySelectorAll('a[target="_blank"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const url = new URL(link.href);
                const isExternal = url.hostname !== window.location.hostname;
                
                if (isExternal) {
                    this.trackEvent('external_link_click', {
                        category: 'engagement',
                        label: url.hostname,
                        value: url.pathname
                    });
                }
            });
        });
    }
}

// Initialize tracker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new PlatformTracker();
    
    // Optional: Track additional metrics
    // tracker.trackScrollDepth();
    // tracker.trackTimeOnPage();
    // tracker.trackExternalLinks();
});

// ========================================================================
// UTILITY: Convert UTM parameters to data attributes
// ========================================================================

function addUTMTracking(link, platform, source, campaign = 'orbit_hub') {
    const url = new URL(link.href);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', platform);
    url.searchParams.set('utm_campaign', campaign);
    link.href = url.toString();
    link.setAttribute('data-utm', 'true');
}

// Apply UTM tracking to all platform links on page load
document.addEventListener('DOMContentLoaded', () => {
    const platformLinks = document.querySelectorAll('[data-platform]');
    
    platformLinks.forEach(link => {
        if (!link.href.includes('utm_')) {
            const platform = link.getAttribute('data-platform');
            const source = link.getAttribute('data-source') || 'orbit_hub';
            addUTMTracking(link, platform, source);
        }
    });
});

// ========================================================================
// EXPORT for testing/debugging
// ========================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformTracker;
}
