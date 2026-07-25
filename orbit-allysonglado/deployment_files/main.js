// ========================================================================
// ORBIT - Main Application Script
// Phase 0 Complete | Reggae-Pop Artist Hub
// ========================================================================

class ORBITApp {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.exitPopup = document.getElementById('exitPopup');
        this.popupClose = document.querySelector('.popup-close');
        this.exitForm = document.getElementById('exitForm');
        this.brevoSignup = document.getElementById('brevoSignup');
        
        this.hasShownExitPopup = false;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupExitIntent();
        this.setupForms();
        this.setupAccessibility();
        console.log('🎵 ORBIT App initialized');
    }

    /**
     * Navigation Setup
     */
    setupNavigation() {
        // Mobile hamburger menu
        if (this.hamburger) {
            this.hamburger.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu when link clicked
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());

            // Set active link based on current page
            if (link.href === window.location.href || 
                link.href === window.location.href.split('?')[0]) {
                link.classList.add('active');
            }
        });
    }

    toggleMenu() {
        this.navMenu.classList.toggle('active');
        this.hamburger.classList.toggle('active');
    }

    closeMenu() {
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
    }

    /**
     * Exit Intent Popup
     * Triggers when user moves mouse towards top/out of window
     */
    setupExitIntent() {
        if (!this.exitPopup) return;

        document.addEventListener('mouseleave', (e) => {
            // Only show once per session
            if (this.hasShownExitPopup) return;
            
            // Only trigger if user leaves from top
            if (e.clientY <= 0) {
                this.showExitPopup();
            }
        });

        // Close popup
        if (this.popupClose) {
            this.popupClose.addEventListener('click', () => {
                this.closeExitPopup();
            });
        }

        // Close when clicking outside
        this.exitPopup.addEventListener('click', (e) => {
            if (e.target === this.exitPopup) {
                this.closeExitPopup();
            }
        });

        // Handle popup form
        if (this.exitForm) {
            this.exitForm.addEventListener('submit', (e) => {
                this.handleExitFormSubmit(e);
            });
        }
    }

    showExitPopup() {
        this.exitPopup.classList.add('active');
        this.hasShownExitPopup = true;
        
        // Track event
        this.trackEvent({
            event: 'exit_intent_popup_shown',
            category: 'engagement',
            label: 'exit_intent'
        });
    }

    closeExitPopup() {
        this.exitPopup.classList.remove('active');
    }

    /**
     * Form Setup
     */
    setupForms() {
        // Homepage email signup
        if (this.brevoSignup) {
            this.brevoSignup.addEventListener('submit', (e) => {
                this.handleEmailSignup(e);
            });
        }
    }

    handleEmailSignup(e) {
        e.preventDefault();
        
        const email = this.brevoSignup.querySelector('input[name="email"]').value;
        
        // Track event
        this.trackEvent({
            event: 'email_signup',
            category: 'conversion',
            value: email,
            label: 'homepage_signup'
        });

        // Send to Brevo (simplified - use actual Brevo API key)
        this.submitToBrevo(email, 'homepage_signup');
    }

    handleExitFormSubmit(e) {
        e.preventDefault();
        
        const email = this.exitForm.querySelector('input[type="email"]').value;
        
        // Track event
        this.trackEvent({
            event: 'email_signup',
            category: 'conversion',
            value: email,
            label: 'exit_intent_popup'
        });

        // Send to Brevo
        this.submitToBrevo(email, 'exit_intent_popup');
        
        // Show confirmation and close
        alert('Thank you! Check your email for confirmation.');
        this.closeExitPopup();
        this.exitForm.reset();
    }

    /**
     * Submit email to Brevo
     * TODO: Replace with actual Brevo API integration
     */
    submitToBrevo(email, source) {
        console.log(`📧 Submitting email to Brevo: ${email} (source: ${source})`);
        
        // This is where you'd actually submit to Brevo
        // Example fetch call (replace with actual endpoint):
        /*
        fetch('/api/brevo/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                source,
                timestamp: new Date().toISOString()
            })
        })
        .then(r => r.json())
        .catch(e => console.error('Brevo submission failed:', e));
        */
    }

    /**
     * Accessibility Setup
     */
    setupAccessibility() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Escape key closes menu
            if (e.key === 'Escape') {
                this.closeMenu();
                if (this.exitPopup?.classList.contains('active')) {
                    this.closeExitPopup();
                }
            }
        });

        // Ensure all interactive elements are focusable
        this.ensureKeyboardAccessibility();
    }

    ensureKeyboardAccessibility() {
        const interactiveElements = document.querySelectorAll(
            'a, button, input, textarea, select'
        );
        
        interactiveElements.forEach(el => {
            if (!el.hasAttribute('tabindex') && el.tabIndex === -1) {
                el.tabIndex = 0;
            }
        });
    }

    /**
     * Google Analytics 4 Event Tracking
     */
    trackEvent(eventData) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventData.event, {
                'event_category': eventData.category,
                'event_label': eventData.label,
                'value': eventData.value
            });
        }
        console.log('📊 Event tracked:', eventData);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ORBITApp();
});

// ========================================================================
// LAZY LOADING IMAGES
// ========================================================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========================================================================
// SMOOTH SCROLL POLYFILL (for older browsers)
// ========================================================================

if (!CSS.supports('scroll-behavior', 'smooth')) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ========================================================================
// PERFORMANCE: Report Web Vitals
// ========================================================================

// Track page load time
const pageLoadStart = performance.timing.navigationStart;
window.addEventListener('load', () => {
    const pageLoadTime = Math.max(0, performance.now());
    if (pageLoadTime > 0) {
        console.log(`📊 Page load time: ${pageLoadTime.toFixed(0)}ms`);
    }
});

// Track Largest Contentful Paint
if ('PerformanceObserver' in window) {
    try {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            const lcp = lastEntry.renderTime || lastEntry.loadTime;
            console.log(`📊 LCP: ${lcp.toFixed(0)}ms`);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        console.log('Web Vitals not available');
    }
}
