/**
 * Main.js - Site-wide interactions and functionality
 */

/**
 * Smooth scroll to anchor
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // Skip if it's just "#" or empty
      if (href === '#' || href === '') return;

      e.preventDefault();

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without page reload
        history.pushState(null, '', href);
      }
    });
  });
}

/**
 * Email form handling
 */
function setupEmailForm() {
  const emailForms = document.querySelectorAll('.email-signup form, [data-email-form]');

  emailForms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const submitButton = this.querySelector('button[type="submit"]');
      const messageDiv = this.querySelector('[data-message]') || this.nextElementSibling;

      if (!emailInput || !emailInput.value) {
        showMessage('Please enter a valid email', 'error', messageDiv);
        return;
      }

      const email = emailInput.value;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error', messageDiv);
        return;
      }

      // Disable button and show loading state
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Signing up...';

        // Track signup
        if (window.trackEmailSignup) {
          trackEmailSignup(email, 'email_form_submit');
        }

        // Simulate form submission (replace with actual backend endpoint)
        setTimeout(() => {
          // In production, send to Brevo or email service
          console.log('[Email Form] Signup submitted:', email);

          showMessage(
            'Thanks for signing up! Check your email for updates.',
            'success',
            messageDiv
          );

          // Reset form
          emailInput.value = '';
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 1000);
      }
    });
  });
}

/**
 * Show message in message container
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', or 'info'
 * @param {HTMLElement} container - Message container element
 */
function showMessage(message, type = 'info', container = null) {
  try {
    if (!container) {
      // Create message container if not provided
      container = document.createElement('div');
      container.className = `message message-${type}`;
      document.body.appendChild(container);
    }

    container.className = `message message-${type}`;
    container.textContent = message;
    container.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);

    console.log(`[Message] ${type}: ${message}`);
  } catch (error) {
    console.error('[Message] Error:', error);
  }
}

/**
 * Mobile menu toggle
 */
function setupMobileMenu() {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navMenu = document.querySelector('.navbar-menu');

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');

    console.log('[Mobile Menu] Toggled');
  });

  // Close menu when link is clicked
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      menuToggle.classList.remove('active');
    });
  });
}

/**
 * Lazy load images
 */
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;

          // Load image
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }

          // Mark as loaded
          img.classList.add('loaded');

          // Stop observing this image
          observer.unobserve(img);

          console.log('[Lazy Load] Image loaded:', img.src);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }
}

/**
 * Setup external link indicators
 */
function setupExternalLinks() {
  const links = document.querySelectorAll('a[href^="http"], a[target="_blank"]');

  links.forEach((link) => {
    // Add external link indicator class
    if (!link.classList.contains('platform-card') && !link.classList.contains('platform-btn')) {
      link.classList.add('external-link');
    }

    // Ensure target="_blank" for external links
    if (link.href.startsWith('http') && !link.href.startsWith(window.location.origin)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
}

/**
 * Setup navigation active state based on current page
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.navbar-menu a');
  const currentPath = window.location.pathname;

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');

    // Check if link matches current path
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Add copy-to-clipboard functionality for code blocks (if applicable)
 */
function setupCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach((block) => {
    const code = block.querySelector('code');
    if (!code) return;

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.title = 'Copy code to clipboard';

    copyButton.addEventListener('click', () => {
      const text = code.textContent;

      navigator.clipboard.writeText(text).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });

    block.appendChild(copyButton);
  });
}

/**
 * Setup theme switcher (if dark mode is supported)
 */
function setupThemeSwitcher() {
  const themeSwitcher = document.querySelector('[data-theme-toggle]');
  if (!themeSwitcher) return;

  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeSwitcher.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    console.log('[Theme] Switched to:', newTheme);
  });
}

/**
 * Setup form validation
 */
function setupFormValidation() {
  const forms = document.querySelectorAll('form');

  forms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      // Check HTML5 validation
      if (!form.checkValidity()) {
        e.preventDefault();
        console.warn('[Form Validation] Form is invalid');
      }
    });

    // Add real-time validation feedback
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => {
        if (!input.validity.valid) {
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      });
    });
  });
}

/**
 * Setup video background (if applicable)
 */
function setupVideoBackground() {
  const videoBg = document.querySelector('[data-video-bg]');
  if (!videoBg) return;

  const videoUrl = videoBg.getAttribute('data-video-bg');
  if (!videoUrl) return;

  const video = document.createElement('video');
  video.src = videoUrl;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.className = 'video-background';

  videoBg.appendChild(video);
}

/**
 * Analytics for user interactions
 */
function setupAnalytics() {
  // Track button clicks
  document.querySelectorAll('button, a.btn').forEach((button) => {
    button.addEventListener('click', function () {
      const buttonText = this.textContent.trim();
      console.log('[Analytics] Button clicked:', buttonText);
    });
  });
}

/**
 * Setup accessibility features
 */
function setupAccessibility() {
  // Ensure all images have alt text
  const images = document.querySelectorAll('img:not([alt])');
  images.forEach((img) => {
    if (!img.alt && img.src) {
      img.alt = 'Image from ' + img.src.split('/').pop();
    }
  });

  // Add skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add keyboard focus indicators
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

/**
 * Detect performance metrics
 */
function setupPerformanceMonitoring() {
  if ('PerformanceObserver' in window) {
    try {
      // Observe Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[Performance] Could not observe LCP');
    }
  }

  // Log page load time
  window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
      const navigationStart = performance.timing.navigationStart;
      const loadEnd = performance.timing.loadEventEnd;
      const loadTime = loadEnd - navigationStart;
      console.log('[Performance] Page load time:', loadTime + 'ms');
    }
  });
}

/**
 * Initialize all features on page load
 */
function initializeSite() {
  try {
    console.log('[Main] Initializing site...');

    // Core functionality
    setupSmoothScroll();
    setupMobileMenu();
    setupNavigation();
    setupExternalLinks();
    setupEmailForm();
    setupFormValidation();

    // UX enhancements
    setupLazyLoading();
    setupThemeSwitcher();
    setupCodeBlocks();
    setupVideoBackground();

    // Accessibility & Analytics
    setupAccessibility();
    setupAnalytics();
    setupPerformanceMonitoring();

    console.log('[Main] Site initialized successfully');
  } catch (error) {
    console.error('[Main] Initialization error:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSite);
} else {
  initializeSite();
}
