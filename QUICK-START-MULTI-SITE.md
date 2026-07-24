# 🚀 ORBIT Hub Multi-Site - Quick Start

Deploy multiple artist sites independently to Netlify without affecting existing deployments.

## 📋 Current Sites

| Artist | Status | Domain | Directory |
|--------|--------|--------|-----------|
| Allyson Glado | ✅ Production | `orbit-allysonglado.netlify.app` | `orbit-allysonglado/` |
| Ouidah Jazz | 🟡 Staging | `ouidah-jazz.netlify.app` | `Ouidah_jazz/` |
| JECD Trio | 🟡 Staging | `jecd-trio.netlify.app` | `Jecd-trio_orbit-hub/` |

## 🎯 Deploy Ouidah_jazz NOW (Recommended Path)

### Option 1: Netlify UI (Easiest)

```bash
# 1. Push your changes to GitHub
git add Ouidah_jazz/ orbit-sites.config.json
git commit -m "chore: prepare Ouidah Jazz for Netlify deployment"
git push origin main

# 2. Go to https://app.netlify.com
# 3. Click "Add new site" → "Import existing project"
# 4. Select your repo
# 5. Configure:
#    Base directory: Ouidah_jazz
#    Build command: npm run build
#    Publish directory: .
# 6. Add environment variables from Ouidah_jazz/.env.example
# 7. Deploy!
```

### Option 2: CLI Deployment

```bash
cd Ouidah_jazz
netlify init                    # Creates new Netlify site
netlify env:set ANTHROPIC_API_KEY your_key
netlify env:set BREVO_API_KEY your_key
netlify env:set GA4_PROPERTY_ID G-OUIDAH-JAZZ
netlify deploy --prod           # Deploy to production
```

### Option 3: Orchestrator Script

```bash
# List all sites
npm run deploy:list

# Deploy just Ouidah Jazz
npm run deploy:ouidah

# Dry run (preview)
node deploy-multi-site.js deploy ouidah-jazz --dry-run
```

## ✅ Verify Existing Sites Still Work

After deployment:

```bash
# These sites should still be live and unchanged:
# ✓ https://orbit-allysonglado.netlify.app (Production)
# ✓ https://jecd-trio.netlify.app (Staging)

# New site:
# ✓ https://ouidah-jazz.netlify.app (New!)
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `orbit-sites.config.json` | Central config for all sites |
| `deploy-multi-site.js` | Deployment orchestrator script |
| `Ouidah_jazz/netlify.toml` | Site-specific Netlify config |
| `.github/workflows/deploy-orbit-sites.yml` | Auto-deploy on git push |

## 📦 NPM Commands

```bash
npm run deploy:list          # List all sites
npm run deploy:all           # Deploy all sites (sequential)
npm run deploy:allyson       # Deploy Allyson Glado only
npm run deploy:ouidah        # Deploy Ouidah Jazz only
npm run deploy:jecd          # Deploy JECD Trio only
npm run init:site            # Create new artist site (interactive)
```

## 🎨 Add a New Artist Site

```bash
# Interactive setup (prompts for artist info)
npm run init:site

# Or use the PowerShell script directly
.\init-new-artist-site.ps1

# Then follow the onscreen instructions
```

## 🔐 Environment Variables (Netlify)

Set these in each site's Netlify dashboard (Site settings → Build & deploy → Environment):

```env
# Required for all sites
ANTHROPIC_API_KEY=sk-...
BREVO_API_KEY=...
GA4_PROPERTY_ID=G-...

# Optional but recommended
CIRCLE_API_KEY=...
ALLOWED_ORIGIN=https://ouidah-jazz.netlify.app
```

**Never commit `.env` files with secrets!** Use Netlify UI or CLI:

```bash
cd Ouidah_jazz
netlify env:set ANTHROPIC_API_KEY your_key
netlify env:set BREVO_API_KEY your_key
```

## 🌍 Custom Domains (Optional)

To add a custom domain like `togbeadjos.com`:

1. In Netlify dashboard: Site settings → Domain management
2. Click "Add custom domain"
3. Update DNS at your domain registrar:

```
Type: CNAME
Host: @
Value: ouidah-jazz.netlify.app
TTL: 30 min
```

## 📊 Monitoring

Each site has independent analytics and logs:

```bash
# View deployment history
netlify deploy:list --site=SITE_ID

# View live logs
netlify logs --site=SITE_ID
```

## ⚠️ Important Notes

✅ **Safe**: Deploying Ouidah_jazz **cannot affect** orbit-allysonglado because:
- Different Netlify site instances
- Separate build directories
- Independent environment variables
- Isolated CDN/cache

✅ **Scalable**: Adding new artists:
- Run `npm run init:site`
- Customize files
- Add to `orbit-sites.config.json`
- Deploy via Netlify UI or CLI

✅ **Automated**: GitHub Actions will auto-deploy when you push:
- Only changed sites redeploy
- Separate status for each site
- Slack notifications (optional)

## 🚨 Troubleshooting

### Site not deploying?

```bash
cd Ouidah_jazz
git status                  # Check for uncommitted changes
npm run build              # Test build locally
netlify logs               # View Netlify build logs
```

### Environment variables not working?

```bash
# Redeploy to refresh environment
netlify deploy --prod --clear-cache

# Verify variables are set
netlify env:list
```

### Custom domain not resolving?

```bash
# Check DNS propagation
# https://dnschecker.org

# Wait 24-48 hours for full propagation
# Clear browser cache
```

## 📚 Full Documentation

See `MULTI-SITE-ARCHITECTURE.md` for:
- Architecture details
- Advanced configuration
- GitHub Actions setup
- CI/CD pipeline
- Troubleshooting guide

## 🎯 Next Steps

1. **Deploy Ouidah_jazz** (follow Option 1, 2, or 3 above)
2. **Test all features** on staging domain
3. **Configure environment variables** in Netlify
4. **Set up custom domain** (if desired)
5. **Monitor analytics** per artist
6. **Add more artists** as needed

---

**Ready to deploy?** Start with Option 1 (Netlify UI) if you're unsure! 🚀
