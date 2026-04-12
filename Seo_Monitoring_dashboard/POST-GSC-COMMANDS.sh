#!/bin/bash

# ========================================================================
# ORBIT POST-GSC MONITORING COMMANDS
# Execute daily for automated SEO tracking
# ========================================================================

echo "🔍 ORBIT POST-GSC MONITORING"
echo "============================"
echo ""
echo "Date: $(date)"
echo ""

# ========================================================================
# SECTION 1: VERIFY FILES ARE LIVE
# ========================================================================

echo "1️⃣  VERIFYING FILES ARE LIVE"
echo "=============================="
echo ""

echo "Checking sitemap.xml..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://orbit-allysonglado.netlify.app/sitemap.xml)
if [ "$SITEMAP_STATUS" = "200" ]; then
    echo "✅ sitemap.xml: LIVE (HTTP 200)"
else
    echo "❌ sitemap.xml: FAILED (HTTP $SITEMAP_STATUS)"
fi

echo "Checking robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://orbit-allysonglado.netlify.app/robots.txt)
if [ "$ROBOTS_STATUS" = "200" ]; then
    echo "✅ robots.txt: LIVE (HTTP 200)"
else
    echo "❌ robots.txt: FAILED (HTTP $ROBOTS_STATUS)"
fi

echo "Checking homepage..."
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://orbit-allysonglado.netlify.app/)
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    echo "✅ Homepage: LIVE (HTTP 200)"
else
    echo "❌ Homepage: FAILED (HTTP $HOMEPAGE_STATUS)"
fi

echo ""

# ========================================================================
# SECTION 2: CHECK META TAGS & SCHEMA
# ========================================================================

echo "2️⃣  CHECKING META TAGS & SCHEMA"
echo "================================"
echo ""

echo "Fetching homepage..."
HOMEPAGE=$(curl -s https://orbit-allysonglado.netlify.app/)

# Check for description meta tag
if echo "$HOMEPAGE" | grep -q '<meta name="description"'; then
    echo "✅ Meta description found"
    echo "$HOMEPAGE" | grep '<meta name="description"' | head -1
else
    echo "❌ Meta description MISSING"
fi

# Check for robots meta tag
if echo "$HOMEPAGE" | grep -q '<meta name="robots"'; then
    echo "✅ Robots meta tag found"
    echo "$HOMEPAGE" | grep '<meta name="robots"' | head -1
else
    echo "❌ Robots meta tag MISSING"
fi

# Check for Google verification
if echo "$HOMEPAGE" | grep -q 'google-site-verification'; then
    echo "✅ Google verification meta tag found"
else
    echo "⚠️  Google verification meta tag MISSING (needed for GSC)"
fi

# Check for schema.org JSON-LD
if echo "$HOMEPAGE" | grep -q 'schema.org'; then
    echo "✅ Schema.org JSON-LD found"
    SCHEMA_COUNT=$(echo "$HOMEPAGE" | grep -c '"@type"')
    echo "   Found $SCHEMA_COUNT schema types"
else
    echo "❌ Schema.org JSON-LD MISSING"
fi

# Check for Open Graph tags
if echo "$HOMEPAGE" | grep -q 'og:title'; then
    echo "✅ Open Graph tags found"
else
    echo "⚠️  Open Graph tags MISSING (affects social sharing)"
fi

# Check for noindex (should NOT be present)
if echo "$HOMEPAGE" | grep -q 'noindex'; then
    echo "❌ CRITICAL: noindex tag found (blocks indexing)"
else
    echo "✅ No noindex tag (good for indexing)"
fi

echo ""

# ========================================================================
# SECTION 3: VERIFY NETLIFY DEPLOYMENT
# ========================================================================

echo "3️⃣  NETLIFY DEPLOYMENT STATUS"
echo "=============================="
echo ""

echo "Checking response headers..."
curl -s -I https://orbit-allysonglado.netlify.app/ | head -5
echo ""

# ========================================================================
# SECTION 4: SEARCH TESTS (Manual)
# ========================================================================

echo "4️⃣  SEARCH VISIBILITY TESTS (Copy-paste into Google)"
echo "====================================================="
echo ""

echo "Test 1: Site Search"
echo "  site:orbit-allysonglado.netlify.app"
echo "  Expected: Shows all indexed pages"
echo ""

echo "Test 2: Brand Search"
echo "  \"Allyson Glado\" reggae"
echo "  Expected: Your site appears in results"
echo ""

echo "Test 3: Genre Search"
echo "  reggae-pop artist"
echo "  Expected: Your site ranks (lower priority)"
echo ""

echo "Test 4: Music Discovery"
echo "  reggae music streaming"
echo "  Expected: Your site appears (long-term)"
echo ""

echo "Test 5: Location Search"
echo "  reggae artist Paris"
echo "  Expected: Boosts if you have location schema"
echo ""

# ========================================================================
# SECTION 5: GOOGLE SEARCH CONSOLE LINKS
# ========================================================================

echo "5️⃣  GOOGLE SEARCH CONSOLE LINKS"
echo "================================="
echo ""

echo "Open these links to monitor indexing:"
echo ""
echo "📊 Main Dashboard:"
echo "   https://search.google.com/search-console/"
echo ""
echo "📈 Coverage Report (what's indexed):"
echo "   https://search.google.com/search-console/coverage?resource_id=https://orbit-allysonglado.netlify.app/"
echo ""
echo "📉 Performance (clicks, impressions, ranking):"
echo "   https://search.google.com/search-console/performance/search-analytics?resource_id=https://orbit-allysonglado.netlify.app/"
echo ""
echo "🔎 Crawl Stats (Google activity):"
echo "   https://search.google.com/search-console/crawl-stats?resource_id=https://orbit-allysonglado.netlify.app/"
echo ""
echo "📍 Sitemaps (verify submission):"
echo "   https://search.google.com/search-console/sitemaps?resource_id=https://orbit-allysonglado.netlify.app/"
echo ""

# ========================================================================
# SECTION 6: DAILY CHECKLIST
# ========================================================================

echo "6️⃣  DAILY MONITORING CHECKLIST"
echo "=============================="
echo ""

echo "✓ Do this EVERY DAY:"
echo ""
echo "  1. Open Google Search Console"
echo "  2. Go to Coverage tab"
echo "  3. Note number: ___ / 12 pages indexed"
echo "     Week 1 target: 5-8 pages"
echo "     Week 2 target: 12 pages"
echo ""
echo "  4. Go to Performance tab"
echo "  5. Note metrics:"
echo "     - Total clicks: ___"
echo "     - Total impressions: ___"
echo "     - Avg position: ___"
echo ""
echo "  6. Test in Google Search:"
echo "     site:orbit-allysonglado.netlify.app"
echo "     Result count: ___ (should grow)"
echo ""

# ========================================================================
# SECTION 7: WEEKLY SUMMARY
# ========================================================================

echo "7️⃣  WEEKLY SUMMARY TEMPLATE"
echo "==========================="
echo ""

WEEK=$(date +%W)
YEAR=$(date +%Y)

cat > ORBIT_SEO_WEEK_${WEEK}_${YEAR}.txt << 'EOF'
ORBIT SEO WEEKLY SUMMARY
========================

Week: [FILL IN]
Dates: [FILL IN]

INDEXING STATUS:
- Pages indexed on Day 1: ___ / 12
- Pages indexed on Day 3: ___ / 12
- Pages indexed on Day 7: ___ / 12
- Current: ___ / 12

PERFORMANCE METRICS:
- Total clicks (cumulative): ___
- This week's clicks: ___
- Total impressions: ___
- Average position: ___

SEARCH VISIBILITY:
- "Allyson Glado" rank: #___
- "reggae-pop" rank: #___ (or not visible)
- "Allyson Glado reggae" rank: #___

CRAWL STATS:
- Pages crawled this week: ___
- Google activity: [Active / Moderate / Low]

ISSUES/ERRORS:
- Coverage errors: [Yes / No] If yes, describe:
- Crawl errors: [Yes / No] If yes, describe:
- Exclusions: [Yes / No] If yes, describe:

ANALYSIS:
- Growth rate: ___% week-over-week
- Best performing page: ___________
- Pages still not indexed: ___________

NEXT WEEK ACTIONS:
- [ ] Add/update content
- [ ] Fix any errors found
- [ ] Build backlinks
- [ ] Check rankings again
- [ ] Monitor performance

NOTES:
________________________________
________________________________
EOF

echo "✅ Created: ORBIT_SEO_WEEK_${WEEK}_${YEAR}.txt"
echo "   Edit this file with your weekly data"
echo ""

# ========================================================================
# SECTION 8: TROUBLESHOOTING COMMANDS
# ========================================================================

echo "8️⃣  TROUBLESHOOTING COMMANDS"
echo "============================="
echo ""

echo "If sitemap.xml is 404 (not found):"
echo "  → Check: File exists in repo root"
echo "  → Check: Committed to GitHub"
echo "  → Check: Netlify deploy finished"
echo ""

echo "If robots.txt is 404 (not found):"
echo "  → Check: File exists in repo root"
echo "  → Check: git push origin main executed"
echo "  → Check: Netlify shows 'Published'"
echo ""

echo "If pages show 'noindex' in view source:"
echo "  → Remove: <meta name='noindex'> tag"
echo "  → Commit: git add . && git commit && git push"
echo "  → Re-request: indexing in Google Search Console"
echo ""

echo "If coverage shows 0 pages indexed after Day 3:"
echo "  → Check: robots.txt allows pages"
echo "  → Check: No noindex meta tags"
echo "  → Check: No redirect loops"
echo "  → Resubmit: sitemap in Google Search Console"
echo ""

# ========================================================================
# SECTION 9: BATCH URL TESTING
# ========================================================================

echo "9️⃣  BATCH URL TESTING (Check all pages status)"
echo "=============================================="
echo ""

echo "Testing all pages for HTTP status..."
echo ""

URLS=(
    "https://orbit-allysonglado.netlify.app/"
    "https://orbit-allysonglado.netlify.app/music.html"
    "https://orbit-allysonglado.netlify.app/about.html"
    "https://orbit-allysonglado.netlify.app/connect.html"
    "https://orbit-allysonglado.netlify.app/blog/"
)

for url in "${URLS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$STATUS" = "200" ]; then
        echo "✅ $url [200 OK]"
    else
        echo "❌ $url [$STATUS ERROR]"
    fi
done

echo ""

# ========================================================================
# SECTION 10: QUICK REFERENCE
# ========================================================================

echo "🔟 QUICK REFERENCE"
echo "=================="
echo ""

echo "📊 Key Metrics to Track:"
echo "  - Pages Indexed (GSC Coverage): ___ / 12"
echo "  - Total Clicks (GSC Performance): ___"
echo "  - Average Position (GSC Performance): ___"
echo "  - Search rank for 'Allyson Glado': #___"
echo ""

echo "📅 Timeline Expectations:"
echo "  Day 1-2: 0-2 pages indexed"
echo "  Day 3-5: 3-8 pages indexed"
echo "  Day 6-7: 10-12 pages indexed"
echo "  Week 2+: All pages indexed, getting clicks"
echo ""

echo "🚨 Red Flags (Fix IMMEDIATELY):"
echo "  ❌ Pages show 'noindex' in source"
echo "  ❌ robots.txt says 'Disallow: /'"
echo "  ❌ Crawl errors appearing in Coverage"
echo "  ❌ Pages excluded with no reason"
echo ""

echo "✅ Green Flags (You're doing great):"
echo "  ✓ Pages indexed daily"
echo "  ✓ Click count increasing"
echo "  ✓ Position improving (getting lower #)"
echo "  ✓ Google crawling actively"
echo ""

# ========================================================================
# FINAL OUTPUT
# ========================================================================

echo ""
echo "=========================================="
echo "✅ MONITORING COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Check Google Search Console (links above)"
echo "2. Run this script daily for 7 days"
echo "3. Compare metrics day-to-day"
echo "4. Fill in weekly summary template"
echo "5. Test search queries (see Section 4)"
echo ""
echo "Expected result: All 12 pages indexed by Day 7 ✓"
echo ""
echo "Good luck! Keep monitoring daily. 📈"
echo ""

# ========================================================================
# SECTION 11: OPTIONAL - AUTO-OPEN URLS (macOS/Linux)
# ========================================================================

# Uncomment below to auto-open GSC links (macOS only)
# open "https://search.google.com/search-console/coverage?resource_id=https://orbit-allysonglado.netlify.app/"

# For Windows, use:
# start "https://search.google.com/search-console/coverage?resource_id=https://orbit-allysonglado.netlify.app/"

# ========================================================================
# END OF MONITORING SCRIPT
# ========================================================================
