# ORBIT Hub Multi-Site Architecture

A production-ready multi-site deployment system for managing multiple independent artist Orbit Hub pages on Netlify.

## Overview

The multi-site architecture allows you to:
- ✅ Deploy multiple artist sites independently
- ✅ Maintain separate domains and configurations
- ✅ Scale to unlimited artists without breaking existing sites
- ✅ Orchestrate deployments from a central configuration
- ✅ Manage analytics, environment variables, and features per-site

## Architecture

```
orbit-hub/                          (Git root)
├── orbit-sites.config.json         (Central configuration)
├── deploy-multi-site.js            (Deployment orchestrator)
├── MULTI-SITE-ARCHITECTURE.md      (This file)
│
├── orbit-allysonglado/             (Artist Site #1)
│   ├── index.html
│   ├── netlify.toml               (Individual config)
│   ├── package.json
│   └── assets/
│
├── Ouidah_jazz/                    (Artist Site #2)
│   ├── index.html
│   ├── netlify.toml
│   ├── package.json
│   └── assets/
│
└── Jecd-trio_orbit-hub/            (Artist Site #3)
    ├── index.html
    ├── netlify.toml
    └── assets/
```

## Sites Configuration

Each site is defined in `orbit-sites.config.json` with:

```json
{
  "id": "ouidah-jazz",
  "name": "Ouidah Jazz & Gospel",
  "domain": "ouidah-jazz.netlify.app",
  "customDomain": null,
  "directory": "Ouidah_jazz",
  "status": "staging|production",
  "artist": {
    "name": "Togbé Adjos",
    "genre": "Vodun Jazz • Blues",
    "bio": "...",
    "tone": "...",
    "instagram": "...",
    "spotify": "..."
  },
  "analytics": {
    "ga4PropertyId": "G-OUIDAH-JAZZ"
  },
  "features": ["fan-chat", "music-streaming", "social-integration"]
}
```

## Deployment Process

### Option 1: Netlify UI (Recommended for Initial Setup)

1. **Create new site in Netlify dashboard**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import existing project"
   - Select your GitHub repo

2. **Configure build settings**
   ```
   Base directory: Ouidah_jazz
   Build command: npm run build
   Publish directory: .
   ```

3. **Set environment variables**
   - Go to Site settings → Build & deploy → Environment
   - Add from `.env.example`:
     - `ANTHROPIC_API_KEY`
     - `BREVO_API_KEY`
     - `CIRCLE_API_KEY`
     - `GA4_PROPERTY_ID`

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically deploy on push to main

### Option 2: CLI Deployment

```bash
# Deploy a single site
netlify deploy --prod --dir=Ouidah_jazz

# Or using the orchestrator
node deploy-multi-site.js deploy ouidah-jazz

# Dry run (preview)
node deploy-multi-site.js deploy ouidah-jazz --dry-run
```

### Option 3: GitHub Actions (Recommended for Production)

Create `.github/workflows/deploy-multi-site.yml`:

```yaml
name: Deploy Multi-Site

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        site: [allyson-glado, ouidah-jazz, jecd-trio]
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy ${{ matrix.site }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID_${{ matrix.site }}: ${{ secrets[format('NETLIFY_SITE_ID_{0}', matrix.site)] }}
        run: |
          npm install -g netlify-cli
          netlify deploy --prod --site=${{ secrets[format('NETLIFY_SITE_ID_{0}', matrix.site)] }}
```

## Adding a New Artist Site

### Step 1: Create Site Directory

```bash
mkdir Artist_Name_orbit-hub
cd Artist_Name_orbit-hub
```

### Step 2: Copy Template Files

Copy from an existing site:
- `index.html`
- `netlify.toml`
- `package.json`
- `.env.example`
- `assets/` folder structure

### Step 3: Customize netlify.toml

```toml
# netlify.toml for new artist
[build]
  base = "."
  publish = "."
  functions = "netlify/functions"

[build.environment]
  GA4_PROPERTY_ID = "G-YOUR-ARTIST-ID"
  ARTIST_NAME = "Artist Name"
  ARTIST_TONE = "artist tone/vibe"
  ARTIST_BIO = "Artist biography"
  NODE_ENV = "production"
```

### Step 4: Update artist-data.json

```json
{
  "nom": "Artist Name",
  "slug": "artist-slug",
  "genre": "Genre",
  "bioCourte": "Short biography",
  "spotify": "https://spotify.com/...",
  "instagram": "https://instagram.com/..."
}
```

### Step 5: Add to orbit-sites.config.json

```json
{
  "id": "artist-slug",
  "name": "Artist Name",
  "domain": "artist-slug.netlify.app",
  "customDomain": null,
  "directory": "Artist_Name_orbit-hub",
  "status": "staging",
  "artist": {
    "name": "Artist Name",
    "genre": "Genre",
    "bio": "Biography",
    "tone": "tone",
    "instagram": "https://instagram.com/...",
    "spotify": "https://spotify.com/..."
  },
  "analytics": {
    "ga4PropertyId": "G-YOUR-ID"
  },
  "features": ["fan-chat", "music-streaming", "social-integration"]
}
```

### Step 6: Create Netlify Site

```bash
cd Artist_Name_orbit-hub
netlify init
# Answer prompts:
# - "Create & configure a new site"
# - Site name: artist-slug
# - Build command: npm run build
# - Publish directory: .
```

### Step 7: Set Environment Variables

```bash
netlify env:set ANTHROPIC_API_KEY your_key
netlify env:set BREVO_API_KEY your_key
netlify env:set GA4_PROPERTY_ID G-YOUR-ID
```

### Step 8: Deploy

```bash
netlify deploy --prod
```

## Deployment Orchestrator Commands

### List All Sites

```bash
node deploy-multi-site.js list
```

Output:
```
Available ORBIT Hub Sites:
============================================================

ID: allyson-glado
  Name: Allyson Glado
  Artist: Allyson Glado
  Genre: Reggae-Pop
  Domain: orbit-allysonglado.netlify.app
  Status: production
  Directory: orbit-allysonglado

ID: ouidah-jazz
  Name: Ouidah Jazz & Gospel
  Artist: Togbé Adjos
  Genre: Vodun Jazz • Blues
  Domain: ouidah-jazz.netlify.app
  Status: staging
  Directory: Ouidah_jazz
...
```

### Deploy Single Site

```bash
# Production deployment
node deploy-multi-site.js deploy ouidah-jazz

# Dry run (preview without deploying)
node deploy-multi-site.js deploy ouidah-jazz --dry-run

# Force deployment despite warnings
node deploy-multi-site.js deploy ouidah-jazz --force
```

### Deploy All Sites

```bash
# Deploy all sites in sequence
node deploy-multi-site.js deploy all

# Dry run for all
node deploy-multi-site.js deploy all --dry-run
```

## Environment Variables

### Shared Environment Variables

All sites should have:

```env
# Claude AI Integration
ANTHROPIC_API_KEY=sk-...

# Email (Brevo/Sendinblue)
BREVO_API_KEY=...

# Web3/Crypto Tipping (Circle)
CIRCLE_API_KEY=...
CIRCLE_API_URL=https://api.sandbox.circle.com
CIRCLE_WALLET_ID=...
CIRCLE_WEBHOOK_SECRET=...

# Analytics
GA4_PROPERTY_ID=G-...

# CORS
ALLOWED_ORIGIN=https://artist-slug.netlify.app
```

### Per-Site Environment Variables

Each site can override:

```env
ARTIST_NAME=Artist Name
ARTIST_TONE=tone/vibe
ARTIST_BIO=biography
NODE_ENV=production
```

## GitHub Secrets for CI/CD

Set these in GitHub Settings → Secrets:

```
NETLIFY_AUTH_TOKEN      # Your Netlify personal access token
NETLIFY_SITE_ID_allyson_glado    # Site ID for Allyson Glado
NETLIFY_SITE_ID_ouidah_jazz      # Site ID for Ouidah Jazz
NETLIFY_SITE_ID_jecd_trio        # Site ID for JECD Trio
```

Get Netlify Site ID from site settings or:
```bash
netlify sites:list
```

## Custom Domains

### Add Custom Domain to Netlify Site

1. In Netlify dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `togbeadjos.com`)
4. Follow DNS instructions for your domain registrar

### DNS Configuration Example (Namecheap)

For `togbeadjos.com` → `ouidah-jazz.netlify.app`:

```
Host: @
Type: CNAME
Value: ouidah-jazz.netlify.app
TTL: 30 min
```

## Monitoring & Analytics

Each site has independent:

- **GA4 Property**: Separate analytics ID per artist
- **Error Logs**: Accessible via Netlify dashboard
- **Performance**: Netlify Analytics dashboard
- **Deployments**: Deployment history per site

### View Site Logs

```bash
# Latest deployment log
netlify deploy:list --site=SITE_ID

# Real-time logs
netlify logs --site=SITE_ID
```

## Troubleshooting

### Site Not Deploying

1. Check git status:
   ```bash
   git status
   git log --oneline -5
   ```

2. Verify netlify.toml:
   ```bash
   cd Artist_Name_orbit-hub
   cat netlify.toml
   ```

3. Check build command:
   ```bash
   npm run build
   ```

4. Review Netlify logs:
   ```bash
   netlify logs --site=SITE_ID
   ```

### Environment Variables Not Working

1. Verify in Netlify UI: Site settings → Build & deploy → Environment
2. Redeploy after setting variables:
   ```bash
   netlify deploy --prod --clear-cache
   ```
3. Check `.env` file not checked into git

### Domain Not Resolving

1. Check Netlify domain settings
2. Verify DNS propagation: https://dnschecker.org
3. Allow 24-48 hours for full propagation
4. Clear browser cache

### Existing Site Not Affected?

✅ Yes! Each site is completely independent:
- Separate Netlify site instance
- Separate git base directory
- Separate environment variables
- Separate CDN/cache

Deploying Ouidah_jazz **cannot affect** orbit-allysonglado because:
- Different Netlify site IDs
- Different build directories
- Different environment variable scopes

## Best Practices

### 1. Version Control

Always commit before deployment:
```bash
git add orbit-sites.config.json Ouidah_jazz/
git commit -m "chore: deploy Ouidah Jazz site to Netlify"
git push origin main
```

### 2. Staging vs Production

Use `status: "staging"` for new sites:
- Test on staging domain first
- Validate all features work
- Move to `status: "production"` when ready

### 3. Environment Variable Security

- ✅ Use Netlify UI for sensitive variables
- ❌ Don't commit `.env` files with secrets
- ✅ Use `.env.example` with placeholder values

### 4. Automated Deployments

Set up GitHub Actions for automatic deployment on push:
```bash
# On every push to main, all updated sites redeploy
```

### 5. Monitoring

Monitor each site independently:
- Netlify Analytics dashboard
- GA4 Property per artist
- Netlify Alerts for errors

## Next Steps

1. ✅ Deploy Ouidah_jazz using Netlify UI
2. ✅ Test all features on staging domain
3. ✅ Configure environment variables
4. ✅ Set up custom domain (optional)
5. ✅ Monitor analytics
6. ✅ Update orbit-sites.config.json to `status: "production"`

## Support

For issues:
- **Netlify Support**: https://support.netlify.com
- **GitHub Docs**: https://docs.github.com
- **CLI Docs**: `netlify --help`

---

**Last Updated**: 2026-07-24
**Version**: 1.0.0
**Maintainer**: Serigne DIAGNE
