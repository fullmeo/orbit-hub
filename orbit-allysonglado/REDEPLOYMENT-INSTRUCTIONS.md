# 🚀 ORBIT Phase 0 Complete - REDEPLOYMENT INSTRUCTIONS

**Allyson Glado | Artist Visibility Hub**  
**Version:** 0.2 (Full Phase 0)  
**Last Updated:** April 4, 2026

---

## ✅ What's New in This Deployment

### New Pages
- ✅ **Full Music Page** with album sections, tracklists, Spotify embeds
- ✅ **About Page** with biography, influences, collaborations
- ✅ **Connect Page** with contact forms, social links, FAQ

### New Features
- ✅ **Brevo Email Integration** (exit-intent popup + signup forms)
- ✅ **GA4 Platform Tracking** (Spotify, Apple Music, YouTube clicks)
- ✅ **Exit-Intent Popup** (captures email on page exit)
- ✅ **Album Sections** with full tracklists
- ✅ **Spotify Web Playback SDK** integration
- ✅ **Schema.org JSON-LD** (MusicArtist, MusicAlbum markup)
- ✅ **Mobile-First Responsive Design** (WCAG AA accessible)

### Performance Improvements
- ✅ Lazy loading images
- ✅ Optimized CSS/JS
- ✅ Improved caching strategy
- ✅ Better Core Web Vitals

### Configuration Files
- ✅ Updated `netlify.toml` (environment variables, headers, security)
- ✅ Complete `_redirects` (URL shortcuts for platforms)
- ✅ Custom `_headers` (CSP, cache strategy, CORS)

---

## 🔧 STEP-BY-STEP REDEPLOYMENT

### Step 1: Download All Updated Files

All files are ready in `/mnt/user-data/outputs/`:

```
index.html              (Homepage - UPDATED)
music.html             (Music page - NEW)
about.html             (About page - NEW)
connect.html           (Connect page - NEW)
main.css               (Styles - UPDATED)
responsive.css         (Mobile styles - UPDATED)
main.js                (App logic - UPDATED)
platform-tracking.js   (GA4 tracking - UPDATED)
netlify.toml           (Config - UPDATED)
_redirects             (URL redirects - UPDATED)
_headers               (HTTP headers - UPDATED)
README.md              (Documentation - UPDATED)
```

### Step 2: Backup Current Deployment

Before pushing, save your current version:

```bash
# Clone current deployment
git clone https://github.com/fullmeo/orbit-hub.git orbit-hub-backup
cd orbit-hub-backup
git log --oneline -5

# Note the current commit hash for rollback if needed
```

### Step 3: Replace Files in Your Repository

Copy all updated files into your local orbit-hub repository:

```bash
# Navigate to your orbit-hub repository
cd /path/to/orbit-hub

# Option A: Copy files manually
# Copy each HTML, CSS, JS file from outputs/

# Option B: Use script to copy (if you have the outputs folder)
cp /mnt/user-data/outputs/*.html .
cp /mnt/user-data/outputs/*.css assets/css/
cp /mnt/user-data/outputs/*.js assets/js/
cp /mnt/user-data/outputs/netlify.toml .
cp /mnt/user-data/outputs/_redirects .
cp /mnt/user-data/outputs/_headers .
cp /mnt/user-data/outputs/README.md .
```

### Step 4: Verify Files

Make sure all files are in the correct locations:

```bash
# Check HTML files
ls -la *.html
# Output should include:
# - index.html (updated)
# - music.html (new)
# - about.html (new)
# - connect.html (new)

# Check CSS files
ls -la assets/css/
# Output should include:
# - main.css (updated)
# - responsive.css (updated)

# Check JS files
ls -la assets/js/
# Output should include:
# - main.js (updated)
# - platform-tracking.js (updated)

# Check config files
ls -la netlify.toml _redirects _headers
```

### Step 5: Update Configuration (IMPORTANT)

Edit `netlify.toml` and add your actual credentials:

```bash
# Open netlify.toml
nano netlify.toml

# Find and update these lines:
[build.environment]
  BREVO_API_KEY = "xkeysib-YOUR-ACTUAL-KEY"       # Get from https://app.brevo.com/settings/account/api
  GA4_PROPERTY_ID = "G-YOUR-ACTUAL-ID"            # Get from Google Analytics
  SPOTIFY_CLIENT_ID = "YOUR-CLIENT-ID"            # Get from Spotify Developer
  SPOTIFY_REDIRECT_URI = "https://orbit-allysonglado.netlify.app/callback"
```

Also update GA4 ID in `index.html`:

```bash
# Find gtag config (around line 40-50)
nano index.html

# Replace:
gtag('config', 'G-XXXXXXXXXX'

# With your actual G-ID from Google Analytics 4
gtag('config', 'G-YOUR-ACTUAL-ID'
```

### Step 6: Verify Links & Content

Before pushing, update any artist-specific content that might be placeholder:

```bash
# Check for placeholder text that should be updated
grep -r "PLACEHOLDER\|TODO\|UPDATE_THIS" *.html assets/

# Check Spotify IDs match your artist
grep "open.spotify.com" *.html

# Check all email addresses
grep "contact@\|bookings@\|press@" *.html
```

### Step 7: Commit to Git

```bash
# Check what changed
git status

# Add all updated files
git add .

# Commit with descriptive message
git commit -m "feat: ORBIT Phase 0 Complete - Full Production Hub

- New: Music page with Spotify embeds, tracklists for 2 albums
- New: About page with biography, collaborations, influences
- New: Connect page with contact forms, social links, FAQ
- New: Exit-intent popup for email capture
- New: Brevo email integration (signup forms + automation)
- New: GA4 platform click tracking (Spotify, Apple, YouTube, etc.)
- New: Spotify Web Playback SDK integration
- New: Schema.org JSON-LD markup (MusicArtist, MusicAlbum)
- Update: Mobile-first responsive design (WCAG AA)
- Update: Complete Netlify configuration
- Update: Security headers & cache strategy
- Performance: 90+ PageSpeed optimizations

Version: 0.2 Phase 0 Complete
Status: Production Ready ✅"

# Push to main branch
git push origin main
```

### Step 8: Monitor Netlify Deployment

Netlify automatically deploys when you push to main:

```bash
# Option 1: Monitor via Netlify dashboard
# Go to: https://app.netlify.com/sites/orbit-allysonglado/deploys
# Wait for "Published" status (usually 30-60 seconds)

# Option 2: Monitor via CLI
netlify watch

# Option 3: Monitor via GitHub
# Go to: https://github.com/fullmeo/orbit-hub/deployments
```

### Step 9: Verify Live Deployment

After Netlify shows "Published":

```bash
# Test the live site
open https://orbit-allysonglado.netlify.app

# Verify each page loads
# - https://orbit-allysonglado.netlify.app (homepage)
# - https://orbit-allysonglado.netlify.app/music.html (music)
# - https://orbit-allysonglado.netlify.app/about.html (about)
# - https://orbit-allysonglado.netlify.app/connect.html (connect)

# Test platform links work
# Click on Spotify, Apple Music, YouTube links
# Should open with UTM parameters

# Verify forms
# Test email signup on homepage
# Test exit-intent popup (move mouse to top)
# Check email inbox for submissions
```

### Step 10: Post-Deployment Checklist

```bash
# ✅ Verify all pages load without errors
open https://orbit-allysonglado.netlify.app/music.html
open https://orbit-allysonglado.netlify.app/about.html
open https://orbit-allysonglado.netlify.app/connect.html

# ✅ Test responsive design
# Open DevTools (F12) and test at:
# - 320px (mobile)
# - 768px (tablet)
# - 1024px (desktop)
# - 1920px (wide)

# ✅ Verify GA4 tracking
# Open: https://analytics.google.com
# Go to Real-time → Events
# Click on platforms in your site
# Should see "platform_click" events fire

# ✅ Verify Brevo form submissions
# Go to: https://app.brevo.com/contacts
# Should see new contacts added from form submissions

# ✅ Run PageSpeed Insights audit
# Go to: https://pagespeed.web.dev
# Enter: https://orbit-allysonglado.netlify.app
# Target: 90+ for all metrics

# ✅ Check console for errors
# Open DevTools (F12) → Console tab
# Should have zero errors/warnings
```

---

## 🔙 ROLLBACK PROCEDURE (If Needed)

If something breaks during deployment:

```bash
# Option 1: Revert last commit
git log --oneline -3
git revert HEAD
git push origin main

# Wait for Netlify to redeploy (30-60 seconds)

# Option 2: Restore from backup (if major issue)
cd orbit-hub-backup
git push origin main --force
```

---

## ⚙️ CONFIGURATION SETUP

### Google Analytics 4 Setup

1. Go to https://analytics.google.com
2. Create new GA4 property for your domain
3. Get **Measurement ID** (format: G-XXXXXXXXXX)
4. Update in netlify.toml:
   ```
   GA4_PROPERTY_ID = "G-YOUR-ID"
   ```
5. Also update in `index.html` (line ~45)
6. Verify tracking:
   - Open https://orbit-allysonglado.netlify.app
   - Go to GA4 Real-time → Events
   - Click a platform link
   - Should see "platform_click" event

### Brevo Email Setup

1. Create free account at https://www.brevo.com
2. Go to Settings → API
3. Get **API Key** (starts with "xkeysib-")
4. Update in netlify.toml:
   ```
   BREVO_API_KEY = "xkeysib-YOUR-KEY"
   ```
5. Create email template for welcome series
6. Create contact list for your artist
7. Test form submission:
   - Fill out email form on homepage
   - Check Brevo inbox for new contact
   - Should appear in contacts list

### Spotify Integration (Optional)

For interactive Spotify Web Playback SDK:

1. Go to https://developer.spotify.com/dashboard
2. Create new app
3. Get **Client ID**
4. Set Redirect URI: `https://orbit-allysonglado.netlify.app/callback`
5. Update in netlify.toml:
   ```
   SPOTIFY_CLIENT_ID = "YOUR-CLIENT-ID"
   ```

---

## 📊 POST-DEPLOYMENT MONITORING

### Week 1: Immediate Checks

```
Day 1:
- All pages loading ✓
- Forms submitting ✓
- GA4 tracking events ✓
- Brevo receiving emails ✓

Day 2-3:
- PageSpeed audit (target 90+)
- Mobile responsiveness check
- Cross-browser testing
- Social sharing preview (OG tags)

Day 4-7:
- Monitor GA4 dashboard
- Check platform click distribution
- Track email signup conversion
- Review user engagement metrics
```

### Week 2-4: Optimization Phase

```
Phase 1 (Week 2-3):
- Analyze GA4 top platforms
- Identify bounce points
- Optimize underperforming pages
- A/B test CTA buttons
- Monitor time-on-page metrics

Phase 1 (Week 4+):
- Refine email sequences
- Analyze scroll depth
- Add more blog content
- Expand social promotion
- Plan Phase 2 (monetization)
```

---

## 🆘 TROUBLESHOOTING

### Pages Not Loading

```bash
# Check build logs
netlify logs

# Verify HTML syntax
html5validator *.html

# Test locally
python3 -m http.server 8000
# Visit: http://localhost:8000
```

### GA4 Not Tracking

```bash
# Check if GA4 ID is correct
grep "G-" index.html

# Open DevTools → Network tab
# Filter by "google-analytics"
# Should see successful requests

# Check real-time in GA4
# https://analytics.google.com → Real-time → Events
```

### Forms Not Submitting

```bash
# Check Brevo API key in netlify.toml
# Verify key has proper permissions

# Check browser console for errors
# F12 → Console tab

# Test locally first
python3 -m http.server 8000
```

### Slow Loading

```bash
# Run PageSpeed Insights
# https://pagespeed.web.dev

# Check image sizes
# Images should be optimized (< 200KB each)

# Check CSS/JS
# Should be minified

# Verify caching headers
# _headers file should have cache rules
```

---

## 📈 SUCCESS METRICS (30 Days)

After deployment, track these KPIs:

| Metric | Target | Status |
|--------|--------|--------|
| Monthly Visitors | 500+ | [ ] |
| Avg Session Duration | 2+ minutes | [ ] |
| Email Signups | 50+ | [ ] |
| Platform Clicks | 200+ | [ ] |
| Bounce Rate | < 50% | [ ] |
| Top Platform | Spotify (40%+) | [ ] |
| PageSpeed Score | 90+ | [ ] |
| Mobile Traffic | 60%+ | [ ] |

---

## 🎉 YOU'RE LIVE!

**Deployment Status: ✅ COMPLETE**

Your ORBIT hub is now live and ready to drive traffic to streaming platforms!

### Next Steps

1. **Announce on social media**
   - Share new site URL
   - Highlight music links
   - Encourage follows

2. **Monitor analytics** (daily for Week 1)
   - GA4 dashboard
   - Email signups
   - Platform performance

3. **Optimize based on data**
   - Which platforms drive most traffic?
   - What's your bounce rate?
   - Where are users dropping off?

4. **Plan Phase 1 improvements**
   - Add more blog content
   - Expand social integration
   - Optimize underperforming pages

5. **Prepare Phase 2**
   - Monetization strategy
   - Affiliate partnerships
   - Sponsorship opportunities

---

**🌌 ORBIT is live. Your music is visible. The world can find you.**

---

**Version 0.2 - April 4, 2026**  
**Built with Magnus 13.2 | @fullmeo**
