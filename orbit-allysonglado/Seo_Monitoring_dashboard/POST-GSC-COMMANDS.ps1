# ========================================================================
# ORBIT POST-GSC MONITORING - POWERSHELL VERSION
# Pour Windows - Copie/colle dans PowerShell ou double-clique pour exécuter
# ========================================================================

Write-Host "🔍 ORBIT POST-GSC MONITORING" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# ========================================================================
# SECTION 1: VERIFY FILES ARE LIVE
# ========================================================================

Write-Host "1️⃣  VERIFYING FILES ARE LIVE" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host ""

# Check sitemap.xml
Write-Host "Checking sitemap.xml..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://orbit-allysonglado.netlify.app/sitemap.xml" -Method Head -ErrorAction Stop
    Write-Host "✅ sitemap.xml: LIVE (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ sitemap.xml: FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

# Check robots.txt
Write-Host "Checking robots.txt..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://orbit-allysonglado.netlify.app/robots.txt" -Method Head -ErrorAction Stop
    Write-Host "✅ robots.txt: LIVE (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ robots.txt: FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

# Check homepage
Write-Host "Checking homepage..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://orbit-allysonglado.netlify.app/" -Method Head -ErrorAction Stop
    Write-Host "✅ Homepage: LIVE (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Homepage: FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""

# ========================================================================
# SECTION 2: CHECK META TAGS & SCHEMA
# ========================================================================

Write-Host "2️⃣  CHECKING META TAGS & SCHEMA" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Fetching homepage HTML..." -ForegroundColor Gray
try {
    $homepage = Invoke-WebRequest -Uri "https://orbit-allysonglado.netlify.app/" -ErrorAction Stop
    $html = $homepage.Content
    
    # Check for description
    if ($html -match '<meta name="description"') {
        Write-Host "✅ Meta description found" -ForegroundColor Green
        $desc = [regex]::Matches($html, '<meta name="description"[^>]*content="([^"]*)"')[0].Groups[1].Value
        Write-Host "   Content: $($desc.Substring(0, [Math]::Min(60, $desc.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Meta description MISSING" -ForegroundColor Red
    }
    
    # Check for robots
    if ($html -match '<meta name="robots"') {
        Write-Host "✅ Robots meta tag found" -ForegroundColor Green
    } else {
        Write-Host "❌ Robots meta tag MISSING" -ForegroundColor Red
    }
    
    # Check for Google verification
    if ($html -match 'google-site-verification') {
        Write-Host "✅ Google verification meta tag found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Google verification meta tag MISSING (needed for GSC)" -ForegroundColor Yellow
    }
    
    # Check for schema.org
    if ($html -match 'schema.org') {
        Write-Host "✅ Schema.org JSON-LD found" -ForegroundColor Green
        $schemaCount = ([regex]::Matches($html, '"@type"')).Count
        Write-Host "   Found $schemaCount schema types" -ForegroundColor Gray
    } else {
        Write-Host "❌ Schema.org JSON-LD MISSING" -ForegroundColor Red
    }
    
    # Check for Open Graph
    if ($html -match 'og:title') {
        Write-Host "✅ Open Graph tags found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Open Graph tags MISSING (affects social sharing)" -ForegroundColor Yellow
    }
    
    # Check for noindex (should NOT be present)
    if ($html -match 'noindex') {
        Write-Host "❌ CRITICAL: noindex tag found (blocks indexing)" -ForegroundColor Red
    } else {
        Write-Host "✅ No noindex tag (good for indexing)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error fetching homepage: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================================================
# SECTION 3: VERIFY NETLIFY DEPLOYMENT
# ========================================================================

Write-Host "3️⃣  NETLIFY DEPLOYMENT STATUS" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking response headers..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://orbit-allysonglado.netlify.app/" -Method Head -ErrorAction Stop
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Server: $($response.Headers['Server'])" -ForegroundColor Gray
    
    # Check for Netlify header
    if ($response.Headers['x-nf-request-id']) {
        Write-Host "✅ Hosted on Netlify (x-nf-request-id found)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error checking headers: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# ========================================================================
# SECTION 4: GOOGLE SEARCH CONSOLE LINKS
# ========================================================================

Write-Host "4️⃣  GOOGLE SEARCH CONSOLE LINKS" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Open these links to monitor indexing:" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Main Dashboard:" -ForegroundColor Cyan
Write-Host "   https://search.google.com/search-console/" -ForegroundColor White
Write-Host ""
Write-Host "📈 Coverage Report (what's indexed):" -ForegroundColor Cyan
Write-Host "   https://search.google.com/search-console/coverage?resource_id=https://orbit-allysonglado.netlify.app/" -ForegroundColor White
Write-Host ""
Write-Host "📉 Performance (clicks, impressions, ranking):" -ForegroundColor Cyan
Write-Host "   https://search.google.com/search-console/performance/search-analytics?resource_id=https://orbit-allysonglado.netlify.app/" -ForegroundColor White
Write-Host ""
Write-Host "🔎 Crawl Stats (Google activity):" -ForegroundColor Cyan
Write-Host "   https://search.google.com/search-console/crawl-stats?resource_id=https://orbit-allysonglado.netlify.app/" -ForegroundColor White
Write-Host ""

# ========================================================================
# SECTION 5: DAILY CHECKLIST
# ========================================================================

Write-Host "5️⃣  DAILY MONITORING CHECKLIST" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host ""

Write-Host "✓ Do this EVERY DAY:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Open Google Search Console (links above)" -ForegroundColor Gray
Write-Host "  2. Go to Coverage tab" -ForegroundColor Gray
Write-Host "  3. Note number: ___ / 12 pages indexed" -ForegroundColor Gray
Write-Host "     Week 1 target: 5-8 pages" -ForegroundColor Gray
Write-Host "     Week 2 target: 12 pages" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Go to Performance tab" -ForegroundColor Gray
Write-Host "  5. Note metrics:" -ForegroundColor Gray
Write-Host "     - Total clicks: ___" -ForegroundColor Gray
Write-Host "     - Total impressions: ___" -ForegroundColor Gray
Write-Host "     - Avg position: ___" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. Test in Google Search:" -ForegroundColor Gray
Write-Host "     site:orbit-allysonglado.netlify.app" -ForegroundColor Gray
Write-Host "     Result count: ___ (should grow)" -ForegroundColor Gray
Write-Host ""

# ========================================================================
# SECTION 6: SEARCH TESTS
# ========================================================================

Write-Host "6️⃣  SEARCH VISIBILITY TESTS (Copy-paste into Google)" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test 1: Site Search" -ForegroundColor Cyan
Write-Host "  site:orbit-allysonglado.netlify.app" -ForegroundColor White
Write-Host "  Expected: Shows all indexed pages" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 2: Brand Search" -ForegroundColor Cyan
Write-Host "  ""Allyson Glado"" reggae" -ForegroundColor White
Write-Host "  Expected: Your site appears in results" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 3: Genre Search" -ForegroundColor Cyan
Write-Host "  reggae-pop artist" -ForegroundColor White
Write-Host "  Expected: Your site ranks (lower priority)" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 4: Location Search" -ForegroundColor Cyan
Write-Host "  reggae artist Paris" -ForegroundColor White
Write-Host "  Expected: Boosts if you have location schema" -ForegroundColor Gray
Write-Host ""

# ========================================================================
# SECTION 7: BATCH URL TESTING
# ========================================================================

Write-Host "7️⃣  BATCH URL TESTING (Check all pages status)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing all pages for HTTP status..." -ForegroundColor Gray
Write-Host ""

$urls = @(
    "https://orbit-allysonglado.netlify.app/",
    "https://orbit-allysonglado.netlify.app/music.html",
    "https://orbit-allysonglado.netlify.app/about.html",
    "https://orbit-allysonglado.netlify.app/connect.html",
    "https://orbit-allysonglado.netlify.app/blog/"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop
        Write-Host "✅ $url [200 OK]" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url [ERROR]" -ForegroundColor Red
    }
}

Write-Host ""

# ========================================================================
# SECTION 8: QUICK REFERENCE
# ========================================================================

Write-Host "8️⃣  QUICK REFERENCE" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 Key Metrics to Track:" -ForegroundColor Cyan
Write-Host "  - Pages Indexed (GSC Coverage): ___ / 12" -ForegroundColor Gray
Write-Host "  - Total Clicks (GSC Performance): ___" -ForegroundColor Gray
Write-Host "  - Average Position (GSC Performance): ___" -ForegroundColor Gray
Write-Host "  - Search rank for 'Allyson Glado': #___" -ForegroundColor Gray
Write-Host ""

Write-Host "📅 Timeline Expectations:" -ForegroundColor Cyan
Write-Host "  Day 1-2: 0-2 pages indexed" -ForegroundColor Gray
Write-Host "  Day 3-5: 3-8 pages indexed" -ForegroundColor Gray
Write-Host "  Day 6-7: 10-12 pages indexed" -ForegroundColor Gray
Write-Host "  Week 2+: All pages indexed, getting clicks" -ForegroundColor Gray
Write-Host ""

Write-Host "🚨 Red Flags (Fix IMMEDIATELY):" -ForegroundColor Red
Write-Host "  ❌ Pages show 'noindex' in source" -ForegroundColor Red
Write-Host "  ❌ robots.txt says 'Disallow: /'" -ForegroundColor Red
Write-Host "  ❌ Crawl errors appearing in Coverage" -ForegroundColor Red
Write-Host "  ❌ Pages excluded with no reason" -ForegroundColor Red
Write-Host ""

Write-Host "✅ Green Flags (You're doing great):" -ForegroundColor Green
Write-Host "  ✓ Pages indexed daily" -ForegroundColor Green
Write-Host "  ✓ Click count increasing" -ForegroundColor Green
Write-Host "  ✓ Position improving (getting lower #)" -ForegroundColor Green
Write-Host "  ✓ Google crawling actively" -ForegroundColor Green
Write-Host ""

# ========================================================================
# FINAL OUTPUT
# ========================================================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ MONITORING COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check Google Search Console (links in Section 4)" -ForegroundColor Gray
Write-Host "2. Run this script daily for 7 days" -ForegroundColor Gray
Write-Host "3. Compare metrics day-to-day" -ForegroundColor Gray
Write-Host "4. Test search queries (see Section 6)" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected result: All 12 pages indexed by Day 7 ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Good luck! Keep monitoring daily. 📈" -ForegroundColor Cyan
Write-Host ""

# ========================================================================
# OPTIONAL: SAVE DAILY LOG
# ========================================================================

# Save this output to a log file
$logPath = "$env:USERPROFILE\Desktop\ORBIT_SEO_Monitoring.log"
Write-Host "Tip: Run this script daily and copy output to track progress" -ForegroundColor Yellow
Write-Host "Save as: $logPath" -ForegroundColor Gray

# ========================================================================
# END OF MONITORING SCRIPT
# ========================================================================
