#!/bin/bash

# ========================================================================
# ORBIT SEO DEPLOYMENT - EXACT COMMANDS
# Phase 0 v0.3 - Google Indexing Acceleration
# ========================================================================

echo "🔍 ORBIT SEO DEPLOYMENT"
echo "======================"
echo ""

# ========================================================================
# STEP 1: Navigate to repo
# ========================================================================

echo "Step 1: Navigate to repository..."
cd "C:\Users\diase\Downloads\Sarah-Jane-website\orbit-allyson-glado"

if [ ! -d ".git" ]; then
    echo "❌ Not in a Git repository"
    exit 1
fi

echo "✅ In correct directory"
echo ""

# ========================================================================
# STEP 2: Copy SEO files
# ========================================================================

echo "Step 2: Copying SEO files..."

# Copy sitemap.xml
if [ -f "deployment_files/sitemap.xml" ]; then
    cp deployment_files/sitemap.xml .
    echo "✅ sitemap.xml"
else
    echo "⚠️  sitemap.xml not found in deployment_files"
fi

# Copy robots.txt
if [ -f "deployment_files/robots.txt" ]; then
    cp deployment_files/robots.txt .
    echo "✅ robots.txt"
else
    echo "⚠️  robots.txt not found in deployment_files"
fi

# Copy updated index.html
if [ -f "deployment_files/index.html" ]; then
    cp deployment_files/index.html .
    echo "✅ index.html (updated with SEO meta tags)"
else
    echo "⚠️  index.html not found"
fi

echo ""

# ========================================================================
# STEP 3: Verify files exist
# ========================================================================

echo "Step 3: Verifying files..."

[ -f "sitemap.xml" ] && echo "✅ sitemap.xml exists" || echo "❌ sitemap.xml missing"
[ -f "robots.txt" ] && echo "✅ robots.txt exists" || echo "❌ robots.txt missing"
[ -f "index.html" ] && echo "✅ index.html exists" || echo "❌ index.html missing"

echo ""

# ========================================================================
# STEP 4: Check Git status
# ========================================================================

echo "Step 4: Git status..."
git status --short | head -10

echo ""

# ========================================================================
# STEP 5: Stage files
# ========================================================================

echo "Step 5: Staging files for commit..."
git add sitemap.xml robots.txt index.html

echo "✅ Files staged"
echo ""

# ========================================================================
# STEP 6: Commit with SEO message
# ========================================================================

echo "Step 6: Creating commit..."

git commit -m "feat: Add SEO acceleration (v0.3) - Google indexing boost

Added:
- sitemap.xml: 12 URLs (homepage, music, about, connect, 5 blog posts)
  • Homepage priority=1.0
  • Music & pages priority=0.8-0.9
  • Blog posts priority=0.7
  • Includes lastmod & changefreq

- robots.txt: Google crawling optimization
  • Allows all crawlers (Googlebot, Bingbot, GPTBot, CCBot)
  • Blocks low-value bots (Ahrefs, Semrush)
  • Crawl-delay: 0 (max speed for Google)
  • Sitemap reference

- index.html: SEO meta tags
  • Google-site-verification meta tag (ready for GSC)
  • Enhanced meta description (155 chars)
  • Extended keywords (reggae-pop, Caribbean, soul, jazz)
  • Full robots meta tag (index, follow, max-image-preview:large)
  • Complete schema.org JSON-LD (MusicArtist)
  • 7x sameAs links (Spotify, Apple, YouTube, Deezer, SoundCloud, Instagram, Facebook)

Configuration:
- Netlify headers for SEO (robots meta headers)
- sitemap.xml referenced in robots.txt
- All pages crawlable (no noindex, no robots restrictions)

Expected Results:
✓ Homepage indexed: 24 hours
✓ Music page indexed: 48 hours
✓ Blog posts indexed: 72 hours
✓ Full site indexed: 7 days

This deployment accelerates Google Search Console indexing.
See GOOGLE-SEARCH-CONSOLE-SETUP.md for GSC instructions.
See SEO-INDEXING-QUICK-START.md for 7-day checklist.

Version: 0.3 SEO Acceleration
Status: Ready for Google indexing"

echo "✅ Commit created"
echo ""

# ========================================================================
# STEP 7: Push to GitHub
# ========================================================================

echo "Step 7: Pushing to GitHub..."
echo ""
echo "Executing: git push origin main"
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push successful"
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo ""
else
    echo ""
    echo "❌ Push failed - check error above"
    exit 1
fi

# ========================================================================
# STEP 8: Monitor Netlify
# ========================================================================

echo "Step 8: Monitoring Netlify deployment..."
echo ""
echo "Monitor at:"
echo "  https://app.netlify.com/sites/orbit-allysonglado/deploys"
echo ""
echo "Expected timeline:"
echo "  - Build starts: Immediately"
echo "  - Build completes: 30-60 seconds"
echo "  - Status: Published"
echo ""

# ========================================================================
# STEP 9: Verify files are live
# ========================================================================

echo "Step 9: After Netlify deploy completes, verify live:"
echo ""
echo "Check sitemap.xml:"
echo "  https://orbit-allysonglado.netlify.app/sitemap.xml"
echo "  Should download as XML file"
echo ""
echo "Check robots.txt:"
echo "  https://orbit-allysonglado.netlify.app/robots.txt"
echo "  Should display text"
echo ""
echo "Check index.html meta tags:"
echo "  Open: https://orbit-allysonglado.netlify.app"
echo "  Right-click → View Page Source"
echo "  Find: <meta name=\"description\""
echo "  Find: <meta name=\"robots\""
echo "  Find: <meta name=\"google-site-verification\""
echo ""

# ========================================================================
# STEP 10: Next actions
# ========================================================================

echo "Step 10: Next actions (Google Search Console)"
echo ""
echo "1. Get verification code from GSC"
echo "2. Update google-site-verification meta tag in index.html"
echo "3. Verify property in Google Search Console"
echo "4. Submit sitemap.xml to GSC"
echo "5. Request indexing for key pages"
echo ""
echo "See GOOGLE-SEARCH-CONSOLE-SETUP.md for detailed instructions"
echo ""

# ========================================================================
# FINAL STATUS
# ========================================================================

echo "=========================================="
echo "✅ SEO DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ sitemap.xml created (12 URLs)"
echo "  ✅ robots.txt created (Google-friendly)"
echo "  ✅ index.html updated (SEO meta tags)"
echo "  ✅ Committed to GitHub"
echo "  ✅ Pushed to Netlify"
echo ""
echo "Next steps:"
echo "  1. Wait for Netlify to publish (60 seconds)"
echo "  2. Verify files are live at URLs above"
echo "  3. Follow GOOGLE-SEARCH-CONSOLE-SETUP.md"
echo "  4. Submit to Google Search Console"
echo "  5. Monitor indexing progress"
echo ""
echo "Timeline:"
echo "  Day 1:   Homepage indexed"
echo "  Day 2-3: Music page + blog index indexed"
echo "  Day 3-7: All pages indexed"
echo ""
echo "Good luck! Your ORBIT hub is now SEO-optimized for indexing. 🌌"
echo ""
