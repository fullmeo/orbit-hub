# 🌌 ORBIT - Artist Visibility Infrastructure

**Production-ready web hub template for independent musicians to centralize their presence across streaming platforms with GA4 analytics and SEO optimization.**

---

## 📊 Current Status

**Version:** 0.2 (Phase 0 Complete)  
**Status:** ✅ **Production Ready**  
**Last Updated:** April 4, 2026  
**Deployment:** https://orbit-allysonglado.netlify.app

### Case Study: Allyson Glado

- **Artist:** Allyson Glado (Reggae-Pop)
- **Platforms:** 7 verified (Spotify, Apple Music, YouTube, Deezer, SoundCloud, Instagram, Facebook)
- **Features:** Full GA4 tracking, Brevo email integration, exit-intent popup, Schema.org markup
- **Performance:** 90+ PageSpeed, WCAG AA accessible
- **Timeline:** Phase 0 launched March 2026

---

## 🚀 Quick Start

### For Allyson Glado (Current Deployment)

The site is live at: **https://orbit-allysonglado.netlify.app**

#### Update Content

Edit these files to customize for your artist:

```bash
# Artist details
index.html          # Homepage, hero, featured music
music.html          # Albums, tracklists, Spotify embeds
about.html          # Biography, influences, collaborations
connect.html        # Contact form, social links, press info

# Configuration
netlify.toml        # Environment variables & build settings
_redirects          # URL shortcuts & platform links
_headers            # Security headers & cache strategy
```

#### Deploy Changes

```bash
# 1. Make changes to files
nano index.html

# 2. Commit to GitHub
git add .
git commit -m "Update: [description of changes]"
git push origin main

# 3. Netlify auto-deploys within 60 seconds
# Monitor at: https://app.netlify.com/sites/orbit-allysonglado
```

---

## 🛠 For New ORBIT Artists (Template Replication)

### Step 1: Fork Repository

```bash
git clone https://github.com/fullmeo/orbit-hub.git
cd orbit-hub
git remote set-url origin [YOUR-NEW-REPO]
```

### Step 2: Customize Artist Details

Update these files with new artist information:

```bash
# Artist metadata
sed -i 's/Allyson Glado/[New Artist]/g' index.html
sed -i 's/reggae-pop/[genre]/g' *.html

# Platform links
# Replace Spotify, Apple, YouTube links with artist's actual links

# Images
# Replace all images in /assets/images/ directory
```

### Step 3: Configure Analytics

```bash
# Update Google Analytics 4 Property ID
# In index.html, replace: G-XXXXXXXXXX with your GA4 ID

# Update Brevo API key
# In netlify.toml, set BREVO_API_KEY environment variable

# Update Spotify credentials (if using Web Playback SDK)
# In netlify.toml, set SPOTIFY_CLIENT_ID
```

### Step 4: Deploy to Netlify

```bash
# Option A: Via Netlify CLI
netlify deploy --prod

# Option B: Connect GitHub to Netlify
# 1. Go to app.netlify.com
# 2. Click "New site from Git"
# 3. Select GitHub repo
# 4. Deploy!
```

---

## 📁 Repository Structure

```
orbit-hub/
├── README.md                              # This file
├── index.html                             # Homepage
├── music.html                             # Albums & Music Page
├── about.html                             # Artist Bio
├── connect.html                           # Contact & Social
├── privacy.html                           # Privacy Policy
├── terms.html                             # Terms of Use
│
├── assets/
│   ├── css/
│   │   ├── main.css                       # Primary styles (reggae-pop aesthetic)
│   │   └── responsive.css                 # Mobile-first responsive design
│   ├── js/
│   │   ├── main.js                        # Core app logic (nav, popups, forms)
│   │   └── platform-tracking.js           # GA4 event tracking for platforms
│   └── images/
│       ├── allyson-main.jpg               # Hero image
│       ├── allyson-about.jpg              # About page image
│       ├── allyson-performance.jpg        # Performance photo
│       ├── elevation-cover.jpg            # Album 1 cover
│       └── smoi-cover.jpg                 # Album 2 cover
│
├── blog/
│   ├── index.html                         # Blog index
│   ├── post-1-allyson-glado.md
│   ├── post-2-reggae-pop-evolution.md
│   ├── post-3-caribbean-music-discovery.md
│   ├── post-4-female-reggae-artists.md
│   └── post-5-reggae-guide-beginners.md
│
├── netlify.toml                           # Netlify configuration
├── _redirects                             # URL redirects
├── _headers                               # Custom HTTP headers
├── robots.txt                             # SEO crawling rules
├── sitemap.xml                            # XML sitemap
├── manifest.json                          # PWA manifest (optional)
│
├── DOCUMENTATION/
│   ├── ANALYTICS-SETUP.md                 # GA4 configuration guide
│   ├── BREVO-INTEGRATION.md               # Email marketing setup
│   ├── SPOTIFY-SDK.md                     # Spotify Web Playback SDK
│   ├── SEO-STRATEGY.md                    # Search engine optimization
│   └── DEPLOYMENT-GUIDE.md                # Production deployment
│
└── .gitignore                             # Git ignore rules
```

---

## ✨ Features

### 🎵 Music Streaming Integration

- ✅ **7 Platform Links:** Spotify, Apple Music, YouTube, Deezer, SoundCloud, Instagram, Facebook
- ✅ **Spotify Web Playback SDK:** Embed player or fallback embeds
- ✅ **Album Pages:** Full tracklists, cover art, platform buttons per album
- ✅ **UTM Parameters:** Auto-generated for attribution tracking

### 📊 Analytics & Tracking

- ✅ **Google Analytics 4:** Event tracking on platform clicks
- ✅ **Conversion Goals:** Email signup, platform clicks, scroll depth, time-on-page
- ✅ **Custom Dashboards:** Platform performance, traffic sources, engagement
- ✅ **Real-time Reporting:** See events as they happen

### 📧 Email Marketing

- ✅ **Brevo Integration:** Form submissions → email list
- ✅ **Exit-Intent Popup:** Capture email before users leave
- ✅ **Newsletter Form:** Homepage and Contact page
- ✅ **Automated Sequences:** Welcome series, release announcements

### 🎨 Design & UX

- ✅ **Reggae-Pop Aesthetic:** Green (forest), Gold (warm), Wood tones
- ✅ **Mobile-First:** Responsive from 320px to 2560px
- ✅ **WCAG AA Accessible:** Keyboard navigation, screen reader support
- ✅ **Fast Loading:** 90+ PageSpeed, lazy loading, optimized images
- ✅ **Smooth Animations:** CSS-only transitions, no janky motion

### 🔍 SEO Optimization

- ✅ **Schema.org Markup:** MusicArtist, MusicAlbum, sameAs
- ✅ **Meta Tags:** OG, Twitter Cards, descriptions per page
- ✅ **Sitemap & Robots:** XML sitemap, crawl directives
- ✅ **Structured Data:** Rich snippets for search results
- ✅ **Internal Linking:** Strategic links between pages

### 🔒 Security & Compliance

- ✅ **HTTPS:** Free SSL with Netlify
- ✅ **Content Security Policy:** Prevent XSS, clickjacking
- ✅ **Privacy Policy:** GDPR, CCPA compliant template
- ✅ **Form Security:** Honeypot fields, rate limiting

---

## 🔧 Configuration

### Environment Variables (netlify.toml)

Set these in Netlify dashboard: **Settings → Build & deploy → Environment**

```bash
BREVO_API_KEY=xkeysib-1234567890abcdef...
GA4_PROPERTY_ID=G-XXXXXXXXXX
SPOTIFY_CLIENT_ID=abc123def456...
SPOTIFY_REDIRECT_URI=https://orbit-yourdomain.netlify.app/callback
```

### Google Analytics 4 Setup

1. Go to https://analytics.google.com
2. Create new GA4 property for your domain
3. Get **Measurement ID** (starts with `G-`)
4. Update in `index.html` → `gtag('config', 'G-XXXXXXXXXX')`
5. Set up conversion goals:
   - `email_signup`
   - `platform_click`
   - `exit_intent_popup`
   - `scroll_depth`

### Brevo Email Integration

1. Create account at https://www.brevo.com
2. Get **API Key** from Settings → API
3. Create contact list for artist
4. Set up email templates:
   - Welcome email
   - Release announcement
   - Newsletter template
5. Enable form notifications to your email

### Spotify Web Playback (Optional)

For interactive Spotify player (advanced):

1. Register app at https://developer.spotify.com/dashboard
2. Get **Client ID**
3. Set Redirect URI: `https://your-domain.netlify.app/callback`
4. Implement OAuth flow in `/netlify/functions/spotify-auth.js`

---

## 📈 Analytics Tracking

### Platform Clicks

The site automatically tracks all platform clicks to GA4:

```javascript
// Event: platform_click
{
  event: "platform_click",
  platform_name: "spotify",
  source_page: "homepage",
  click_type: "mouse|touch|keyboard"
}
```

### Email Signups

```javascript
{
  event: "email_signup",
  category: "conversion",
  label: "homepage_signup|exit_intent_popup"
}
```

### Page Behavior

- Scroll depth (25%, 50%, 75%, 100%)
- Time on page (30s+)
- Bounce rate
- Device type & browser

---

## 🚀 Performance Targets

### Core Web Vitals

| Metric | Target | Status |
|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | ✅ |
| FID (First Input Delay) | < 100ms | ✅ |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ |

### PageSpeed Insights

- **Overall Score:** 90+/100
- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100

Test at: https://pagespeed.web.dev

---

## 🔗 URL Structure

```
/                          Homepage
/music.html                Albums & music
/music.html#elevation      Élévation album
/music.html#smoi           S-Moi album
/about.html                Artist biography
/connect.html              Contact & social
/blog/                     Blog index
/blog/post-1/              Individual blog post
/privacy.html              Privacy policy
/terms.html                Terms of use

# Shortcut redirects (auto-resolve to full URLs)
/spotify                   → Spotify artist link
/apple                     → Apple Music link
/listen                    → /music.html
/contact                   → /connect.html
```

---

## 🛠 Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/fullmeo/orbit-hub.git
cd orbit-hub

# Serve locally (Python 3)
python3 -m http.server 8000

# Or use Node/npm http-server
npx http-server .

# Visit: http://localhost:8000
```

### Testing Checklist

- [ ] All pages load without errors
- [ ] Mobile layout responsive at 320px, 768px, 1024px, 1920px
- [ ] All platform links working (no 404s)
- [ ] GA4 events firing in real-time
- [ ] Forms submitting (check Brevo inbox)
- [ ] Images loading & optimized
- [ ] Keyboard navigation accessible
- [ ] Console has no errors or warnings

### PageSpeed Optimization

```bash
# Check current score
# https://pagespeed.web.dev

# Optimize images
# Use WebP format, compress JPG/PNG
# Lazy load below-fold images

# Minimize CSS/JS
# Remove unused code, tree-shake

# Cache strategy
# See _headers for cache directives
```

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS 14+, Android 10+)

---

## 📄 License

MIT License - See LICENSE file for details

Free to use, modify, and distribute. Attribution appreciated but not required.

---

## 👥 Contributing

This is a portfolio project demonstrating artist visibility infrastructure.

### For your own artist:

1. **Fork the repository** (or clone & modify)
2. **Customize artist details** (name, bios, platforms, images)
3. **Deploy to Netlify** (free, takes 2 minutes)
4. **Configure analytics** (GA4, Brevo, etc.)
5. **Monitor performance** & iterate

### For improvements:

1. Fork repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -m 'Add improvement'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open Pull Request

---

## 📞 Support & Inquiries

- **Author:** Serigne DIAGNE (@fullmeo)
- **Contact:** contact@allysonglado.com
- **GitHub:** https://github.com/fullmeo
- **Portfolio:** https://afrisson.com/serigne-diagne

---

## 🌟 ORBIT Vision

**ORBIT** is a framework for artist visibility infrastructure built by @fullmeo (Meta-Developer, Niveau 5). It demonstrates how AI orchestration can create production-ready web experiences for creative professionals.

### Phase Roadmap

- ✅ **Phase 0:** Single artist hub (Allyson Glado) - COMPLETE
- ⏳ **Phase 1:** Monitoring & optimization (Month 1-3)
- ⏳ **Phase 2:** Monetization infrastructure (Month 3-4)
- ⏳ **Phase 3:** Multi-artist scaling (Month 4-6)
- 🚀 **Vision:** 10+ artists, €5-15K/month passive revenue

### Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Hosting:** Netlify (free, auto-deploy from Git)
- **Analytics:** Google Analytics 4
- **Email:** Brevo (formerly Sendinblue)
- **Music Platforms:** Spotify, Apple Music, YouTube, Deezer, SoundCloud
- **Framework:** Magnus 13.2 (AI orchestration)

---

## 📊 Performance Metrics

**Current (Allyson Glado - April 2026)**

- PageSpeed: 92/100
- Accessibility: 96/100
- Performance: 91/100
- SEO: 100/100
- Mobile Score: 94/100
- Load Time: 1.8s (LCP)
- Time to Interactive: 2.3s

---

**Built with ❤️ by @fullmeo | Powered by Claude & Magnus 13.2**

---

## 🔄 Deployment Checklist (New ORBIT Instance)

- [ ] Fork/clone repository
- [ ] Update artist details (index.html, about.html, etc.)
- [ ] Replace artist images in /assets/images/
- [ ] Update platform links (Spotify, Apple, YouTube IDs)
- [ ] Set environment variables in netlify.toml
- [ ] Create GA4 property, get Measurement ID
- [ ] Set up Brevo account, get API key
- [ ] Connect GitHub repo to Netlify
- [ ] Deploy and verify live site
- [ ] Test all platform links (no 404s)
- [ ] Monitor GA4 real-time events
- [ ] Run PageSpeed Insights audit
- [ ] Check mobile responsiveness
- [ ] Verify form submissions to Brevo
- [ ] Set up email automation in Brevo
- [ ] Create social media accounts
- [ ] Share first announcement
- [ ] Monitor analytics for Week 1

---

**Version 0.2 - Phase 0 Complete | Last Updated: April 4, 2026**
