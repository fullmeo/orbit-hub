# 🌌 ORBIT - Artist Visibility Infrastructure

**Production-ready web hub template for independent musicians to centralize their presence across streaming platforms with GA4 analytics and SEO optimization.**

---

## 📊 Current Status

**Version:** 0.3 (Legal & Copyright Reinforcement - May 2026)
**Status:** ✅ **Production Ready + Strengthened Legal Framework**
**Last Updated:** May 16, 2026

### Key Improvements in v0.3
- Added professional `terms.html` and `privacy.html` with strong **copyright & licensing** clauses
- Clear rules for User-Generated Content and artist ownership
- Benin law reference (Loi 2005-30) + international best practices
- Ready for festival use and artist submissions

---

## Legal & Copyright Best Practices (New in v0.3)

### For Artists using this template:
1. **Customize the legal pages** with your name and contact.
2. **Add your own copyright notice** in the footer of all pages.
3. **In the candidature / contact forms**: Add a checkbox confirming ownership of submitted content.
4. **For music**: Rely on platform licenses (Spotify, etc.) + clear linking.

**Recommended footer addition** (copy-paste into your HTML files):
```html
<footer>
    <p>&copy; 2026 [Your Name]. All rights reserved. | <a href="terms.html">Terms</a> | <a href="privacy.html">Privacy</a></p>
</footer>
```

---

## Quick Start

### For Allyson Glado (Current Deployment)

The site is live at: **https://orbit-allysonglado.netlify.app**

#### Update Content

Edit these files to customize for your artist:

# Artist details
index.html          # Homepage, hero, featured music
music.html          # Albums, tracklists, Spotify embeds
about.html          # Biography, influences, collaborations
connect.html        # Contact form, social links, press info

# Configuration
netlify.toml        # Environment variables & build settings
_redirects          # URL shortcuts & platform links
_headers            # Security headers & cache strategy

#### Deploy Changes

# 1. Make changes to files
nano index.html

# 2. Commit to GitHub
git add .
git commit -m "Update: [description of changes]"
git push origin main

# 3. Netlify auto-deploys within 60 seconds
# Monitor at: https://app.netlify.com/sites/orbit-allysonglado

---

## For New ORBIT Artists (Template Replication)

### Step 1: Fork Repository

git clone https://github.com/fullmeo/orbit-hub.git
cd orbit-hub
git remote set-url origin [YOUR-NEW-REPO]

### Step 2: Customize Artist Details

Update these files with new artist information:

# Artist metadata
sed -i 's/Allyson Glado/[New Artist]/g' index.html
sed -i 's/reggae-pop/[genre]/g' *.html

# Platform links
# Replace Spotify, Apple, YouTube links with artist's actual links

# Images
# Replace all images in /assets/images/ directory

### Step 3: Configure Analytics

# Update Google Analytics 4 Property ID
# In index.html, replace: G-XXXXXXXXXX with your GA4 ID

# Update Brevo API key
# In netlify.toml, set BREVO_API_KEY environment variable

# Update Spotify credentials (if using Web Playback SDK)
# In netlify.toml, set SPOTIFY_CLIENT_ID

### Step 4: Deploy to Netlify

# Option A: Via Netlify CLI
netlify deploy --prod

# Option B: Connect GitHub to Netlify
# 1. Go to app.netlify.com
# 2. Click "New site from Git"
# 3. Select GitHub repo
# 4. Deploy!

---

## Legal Pages

- [terms.html](terms.html) — Conditions d'Utilisation & Droits d'Auteur (renforcé avec clauses de licence et copyright)
- [privacy.html](privacy.html) — Politique de Confidentialité

Ces pages sont conçues pour être facilement personnalisables et adaptées aux artistes indépendants ainsi qu'à l'intégration festival (candidatures artistes).

---

## Contributing & License

MIT License. Feel free to fork, customize, and deploy.

Pour le contexte du Festival Ouidah : Ce template est idéal pour offrir aux artistes sélectionnés leur propre Orbit-hub professionnel avec une gestion rigoureuse des droits.

---

*Renforcé pour une robustesse professionnelle et légale – Mai 2026*