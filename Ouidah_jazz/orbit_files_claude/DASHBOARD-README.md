# 📊 ORBIT SEO MONITORING DASHBOARD

**Location:** `C:\Users\diase\Downloads\Sarah-Jane-website\orbit-allyson-glado\Seo_Monitoring_dashboard`

---

## 🎯 PURPOSE

This folder tracks ORBIT's Google indexing progress over 7 days and beyond.

**Goal:** Get all 12 pages indexed in Google Search within 7 days

**Timeline:**
- Day 1-3: Setup + Google crawling begins
- Day 4-7: Pages appear in search results
- Week 2+: Organic traffic starts

---

## 📋 WHAT'S IN THIS FOLDER

### Daily Logs
```
Daily_Logs/
├── Day_1.txt   ← Run monitoring script, paste results
├── Day_2.txt   ← Same routine
├── Day_3.txt
├── Day_4.txt
├── Day_5.txt
├── Day_6.txt
├── Day_7.txt
```

**How to use:**
1. Each morning, run: `POST-GSC-COMMANDS.ps1`
2. Copy output → paste into `Day_X.txt`
3. Add notes about what you observed
4. Compare day-to-day

### Weekly Summaries
```
Weekly_Summaries/
├── Week_1_Summary.txt   ← Analyze 7 days of data
├── Week_2_Summary.txt   ← Compare to Week 1
├── Week_3_Summary.txt
└── Week_4_Summary.txt
```

### Tracking Spreadsheet
```
Tracking_Spreadsheet.xlsx

Columns:
- Date
- Pages Indexed (GSC Coverage)
- Total Clicks (GSC Performance)
- Avg Position (GSC Performance)
- Search Rank for "Allyson Glado"
- Notes
```

### Screenshots
```
Screenshots/
├── GSC_Coverage_Day1.png      ← How many pages indexed
├── GSC_Coverage_Day3.png      ← Track progress
├── GSC_Performance_Week1.png  ← Clicks + impressions
├── Search_Test_Day3.png       ← site: search results
└── Search_Test_Week2.png      ← Brand search rank
```

### URLs to Monitor
```
URLs_to_Monitor.txt

Quick-paste list of:
- Google Search Console links
- Site test URLs
- GSC report pages
```

### Daily Checklist
```
Checklist.txt

Print & check off daily:
☐ Morning: Run script
☐ Midday: Test searches
☐ Evening: Check for errors
☐ Weekly: Summarize
```

---

## ⚡ DAILY ROUTINE (5 minutes)

### ☀️ Morning (9 AM)

```
1. Open PowerShell
2. Navigate to repo:
   cd "C:\Users\diase\Downloads\Sarah-Jane-website\orbit-allyson-glado"

3. Run monitoring script:
   powershell -ExecutionPolicy Bypass -File ".\POST-GSC-COMMANDS.ps1"

4. Copy output → paste into:
   Seo_Monitoring_dashboard\Daily_Logs\Day_X.txt

5. Add notes:
   - Pages indexed today: ___ / 12
   - Any errors? Y/N
   - Search tests passing? Y/N
```

### 🌤️ Midday (12 PM)

```
1. Open Google Search and test:
   site:orbit-allysonglado.netlify.app
   
2. Note results count: ___ (should grow daily)

3. Add to Day_X.txt:
   - Site search results: ___
   - Homepage visible? Y/N
   - Music page visible? Y/N
```

### 🌙 Evening (6 PM)

```
1. Check Google Search Console:
   https://search.google.com/search-console/

2. Go to Coverage tab
3. Note any errors or exclusions
4. Screenshot if status changed
5. Add to Day_X.txt
```

---

## 📅 WEEKLY ROUTINE (Sunday)

### 1. Review Data
```
Open all 7 daily logs (Day_1 → Day_7)
Compile metrics:
- Starting pages indexed: ___
- Ending pages indexed: ___
- Growth: +___ pages
- Total clicks: ___
- Avg position: ___
```

### 2. Create Summary
```
Edit: Weekly_Summaries/Week_1_Summary.txt

Include:
- Indexing progress
- Crawl activity
- Search visibility
- Any issues encountered
- What to improve Week 2
```

### 3. Update Spreadsheet
```
Tracking_Spreadsheet.xlsx

Add row for each day with:
- Date
- Pages indexed count
- Clicks
- Position
- Notes
```

### 4. Take Screenshots
```
Screenshots/

Save screenshots of:
- GSC Coverage report
- GSC Performance report
- Google search test results
- Any error messages
```

---

## 🎯 EXPECTED METRICS BY DAY

### Day 1-2
```
Pages Indexed: 0-2 / 12
Clicks: 0-5
Position: N/A
Status: Submitted, not yet crawled
```

### Day 3-5
```
Pages Indexed: 3-8 / 12
Clicks: 5-20
Position: 20-30 (starting to rank)
Status: Indexing in progress
```

### Day 6-7
```
Pages Indexed: 10-12 / 12
Clicks: 20-50
Position: 10-20
Status: Mostly indexed ✓
```

### Week 2
```
Pages Indexed: 12 / 12
Clicks: 50-150
Position: 5-15
Status: All indexed, ranking improving ✓
```

---

## 🚨 RED FLAGS TO WATCH

### Critical Issues (Fix Immediately)

```
❌ Pages show "noindex" in source
→ Remove noindex meta tag, resubmit

❌ robots.txt says "Disallow: /"
→ Change to "Allow: /", push to GitHub

❌ Crawl errors in Coverage
→ Fix issues, validate fix, re-request

❌ 404 errors on pages
→ Fix broken links/redirects
```

### Warning Signs (Monitor)

```
⚠️ No pages indexed after Day 3
→ Check robots.txt, check for noindex

⚠️ Pages indexed then disappeared
→ Check for noindex, crawl errors

⚠️ Very low click-through rate
→ Improve meta descriptions, improve speed

⚠️ Still not visible after Week 1
→ Add more content, build backlinks
```

---

## 📊 SAMPLE DAY_1.txt

```
═══════════════════════════════════════
ORBIT SEO MONITORING - DAY 1
Date: April 5, 2026 - 09:00 AM
═══════════════════════════════════════

SETUP COMPLETED:
✅ GSC property verified
✅ Sitemap submitted (12 URLs)
✅ Homepage requested for indexing
✅ Music page requested
✅ Blog pages requested (5 URLs)

FILE STATUS:
✅ sitemap.xml: LIVE
✅ robots.txt: LIVE
✅ Homepage: LIVE

META TAGS:
✅ Description: Found
✅ Robots tag: Found
✅ Google verification: Found
✅ Schema.org: Found
⚠️ Open Graph: Missing (not critical)
✅ No noindex: Good

GOOGLE SEARCH CONSOLE:
- Coverage: 0/12 pages (normal, just submitted)
- Sitemap: "Downloaded" status
- Crawl stats: Google active? Y/N

SEARCH TESTS:
- site:orbit-allysonglado.netlify.app → 0 results (normal Day 1)
- "Allyson Glado" reggae → Not visible yet (normal)

NOTES:
- All systems go, ready for crawling
- Expect pages to start appearing Day 2-3
- GSC setup complete

NEXT: Repeat tomorrow morning
═══════════════════════════════════════
```

---

## 📈 SAMPLE WEEK_1_SUMMARY.txt

```
═══════════════════════════════════════
ORBIT SEO MONITORING - WEEK 1 SUMMARY
Dates: April 5-11, 2026
═══════════════════════════════════════

INDEXING PROGRESS:
- Day 1: 0/12 pages indexed
- Day 3: 3/12 pages indexed
- Day 5: 7/12 pages indexed
- Day 7: 11/12 pages indexed
- Growth: +11 pages (91% indexed)

PERFORMANCE:
- Total clicks (Week 1): 42 clicks
- Total impressions: 180 impressions
- Avg position: 15.3
- Homepage rank for "Allyson Glado": #8

SEARCH VISIBILITY:
- site: search results: 11 pages showing
- Homepage: Page 1 (#8)
- Music page: Page 1 (#12)
- Blog posts: Pages 2-3 starting

CRAWL ACTIVITY:
- Pages crawled: 47 pages
- Crawl budget: Good (no limitations)
- Response time: <1s (excellent)

ISSUES:
- 1 page still excluded (music.html redirect)
- Fixed: Re-requested indexing

WINS:
✓ 91% indexed by Day 7
✓ Homepage ranking
✓ Organic clicks appearing
✓ No critical errors

WEEK 2 PLAN:
- [ ] Index remaining 1 page
- [ ] Improve music.html rank
- [ ] Monitor click growth
- [ ] Add first blog post update

═══════════════════════════════════════
```

---

## 🔗 QUICK LINKS (Copy to URLs_to_Monitor.txt)

```
GOOGLE SEARCH CONSOLE:
https://search.google.com/search-console/coverage?resource_id=https://orbit-allysonglado.netlify.app/

PERFORMANCE:
https://search.google.com/search-console/performance/search-analytics?resource_id=https://orbit-allysonglado.netlify.app/

CRAWL STATS:
https://search.google.com/search-console/crawl-stats?resource_id=https://orbit-allysonglado.netlify.app/

LIVE SITE:
https://orbit-allysonglado.netlify.app/
https://orbit-allysonglado.netlify.app/sitemap.xml
https://orbit-allysonglado.netlify.app/robots.txt

NETLIFY DEPLOYS:
https://app.netlify.com/sites/orbit-allysonglado/deploys

SEARCH TESTS:
site:orbit-allysonglado.netlify.app
"Allyson Glado" reggae
reggae-pop artist
```

---

## ✅ CHECKLIST.txt TEMPLATE

```
☀️ MORNING (9 AM)
☐ Run POST-GSC-COMMANDS.ps1
☐ Copy output → Day_X.txt
☐ Note pages indexed: ___ / 12
☐ Open GSC Coverage tab

🌤️ MIDDAY (12 PM)
☐ Test: site:orbit-allysonglado.netlify.app
☐ Note: ___ results
☐ Update Day_X.txt

🌙 EVENING (6 PM)
☐ Check GSC for errors
☐ Review crawl stats
☐ Screenshot if changed
☐ Update Day_X.txt

📋 SUNDAY (Weekly Summary)
☐ Review all 7 daily logs
☐ Create Weekly_Summary
☐ Update spreadsheet
☐ Take screenshots
☐ Plan Week 2
```

---

## 🎯 SUCCESS CRITERIA

Your monitoring dashboard shows success when:

✅ **Day 3:** 3+ pages indexed  
✅ **Day 5:** 7+ pages indexed  
✅ **Day 7:** 10+ pages indexed  
✅ **Week 2:** All 12 pages indexed  
✅ **Week 2:** 50+ clicks from search  
✅ **Week 4:** Multiple pages ranking  

---

## 📞 SUPPORT

If something looks wrong, check:

1. **POST-GSC-MONITORING.md** (Troubleshooting section)
2. **MONITORING-DASHBOARD.md** (Red flags section)
3. **Google Search Console** (Coverage → Errors)

---

**Version:** 0.3 Monitoring Dashboard
**Created:** April 4, 2026
**Your Goal:** Index ORBIT in Google within 7 days ✓
