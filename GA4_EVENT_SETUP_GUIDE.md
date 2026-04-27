# 🎯 GA4 Event Setup Guide
**Property ID:** G-LS4G24ESNF  
**Status:** Core events active ✅  
**Setup Time:** ~15 minutes

---

## Part 1: Verify Core Tracking (Already Deployed)

### Check Installation Status

**Step 1:** Open GA4 Real-Time Dashboard
- Go: https://analytics.google.com/analytics/web/#/report/realtime/
- Property: "ORBIT - Sarah Jane Website"
- You should see real-time events as you navigate

**Step 2:** Test Page Tracking
1. Visit https://orbit-allysonglado.netlify.app/
2. Open GA4 Real-Time Dashboard
3. Look for new user session within 1-2 seconds
4. Navigate to `/about.html`, `/music.html`, `/connect.html`
5. Verify page_path events appear for each page

**Step 3:** Confirm All Pages Have GA4 Tag
```bash
# Check index.html
grep "G-LS4G24ESNF" index.html
# Should show: gtag/js?id=G-LS4G24ESNF

# Check about.html
grep "G-LS4G24ESNF" about.html
# Should show: gtag/js?id=G-LS4G24ESNF

# Check music.html
grep "G-LS4G24ESNF" music.html
# Should show: gtag/js?id=G-LS4G24ESNF

# Check connect.html
grep "G-LS4G24ESNF" connect.html
# Should show: gtag/js?id=G-LS4G24ESNF
```

---

## Part 2: Configure Custom Events in GA4 Admin

### Event 1: Email Signup Conversion

**Step 1:** Create Event in GA4
1. Go to GA4 > Admin > Events
2. Click "+ Create Event"
3. **Event Name:** `email_signup`
4. **Trigger Condition:**
   - Match Type: Event Name
   - Event Name: `view_item_list` (we'll modify this)
   - Equals: `email_signup`
5. Click "Create"

**Step 2:** Send Event from Frontend
- File: `assets/js/main.js`
- When form submits (in `submitToBrevo()` function):

```javascript
// Add this line after successful submission
if (response.success) {
  gtag('event', 'email_signup', {
    'email_domain': new URL('mailto:' + email).hostname,
    'signup_form': form_location,
    'timestamp': new Date().toISOString()
  });
}
```

**Step 3:** Mark as Conversion
1. Go to GA4 > Admin > Conversions
2. Click "+ New Conversion Event"
3. Select: `email_signup`
4. Toggle ON to enable tracking
5. Save

---

### Event 2: Platform Click (UTM Tracking)

**Current State:** Platform links use `data-event` attributes
- Example: `<a href="https://spotify.com/..." data-event="platform_spotify">`

**Step 1:** Add UTM Parameters to Links
- File: `assets/js/platform-tracking.js`
- Pattern: `?utm_source=orbit&utm_medium=website&utm_campaign=phase1&utm_content=spotify`

```javascript
// Enhanced platform link tracking
const platformLinks = {
  spotify: 'https://open.spotify.com/artist/7CgVDnTyDJjV0zZ5GFqdz1?utm_source=orbit&utm_medium=website&utm_campaign=phase1&utm_content=spotify',
  apple: 'https://music.apple.com/us/artist/allyson-glado/1209476753?utm_source=orbit&utm_medium=website&utm_campaign=phase1&utm_content=apple',
  youtube: 'https://www.youtube.com/channel/UCHbce4yJr6SJ_pAsvtbG7ag?utm_source=orbit&utm_medium=website&utm_campaign=phase1&utm_content=youtube',
  // ... etc
};
```

**Step 2:** Create Event in GA4
1. Go to GA4 > Admin > Events
2. Click "+ Create Event"
3. **Event Name:** `platform_click`
4. **Trigger Condition:**
   - Match Type: Page Location
   - Page Location: `contains` → `utm_source=orbit`
5. Click "Create"

**Step 3:** Mark as Conversion (Optional)
- Repeat step 3 from Event 1 if you want to track platform clicks as conversions

---

### Event 3: Email Form Interaction

**Purpose:** Track email submission attempts (success + failure)

**Step 1:** Add Event to Form Submit
- File: `assets/js/main.js`
- When form is submitted (before API call):

```javascript
gtag('event', 'form_submit', {
  'form_type': 'email_signup',
  'form_location': 'homepage', // or 'connect', etc
  'form_id': formElement.id
});

// On success:
gtag('event', 'form_success', {
  'form_type': 'email_signup',
  'timestamp': new Date().toISOString()
});

// On error:
gtag('event', 'form_error', {
  'form_type': 'email_signup',
  'error_message': error.message
});
```

**Step 2:** Create Events in GA4
1. Repeat above for events: `form_submit`, `form_success`, `form_error`
2. These track the customer journey

---

## Part 3: Social Link Tracking

### Current State
Social links have `data-event` attributes:
```html
<a href="https://instagram.com/allysonglado" data-event="social_instagram">
  Instagram
</a>
```

### Setup Event Tracking

**Step 1:** Add GA4 Event Code
- File: `assets/js/main.js`
- Add event listener to all `[data-event]` links:

```javascript
document.querySelectorAll('[data-event]').forEach(link => {
  link.addEventListener('click', (e) => {
    const eventName = link.dataset.event;
    const platform = eventName.replace('social_', '').replace('platform_', '');
    
    gtag('event', eventName, {
      'link_url': link.href,
      'link_text': link.textContent,
      'platform': platform,
      'click_timestamp': new Date().toISOString()
    });
  });
});
```

**Step 2:** Create Events in GA4
1. Event Names: `social_instagram`, `social_facebook`, `social_tiktok`, `social_youtube`
2. Trigger: Page element clicks with `data-event` attribute
3. Optional: Mark as conversions if you want to track social engagement

---

## Part 4: Real-Time Monitoring Setup

### Dashboard View (What to Watch Daily)

1. **Real-Time Events**
   - URL: https://analytics.google.com/analytics/web/#/report/realtime/
   - Shows: Events in the last 30 seconds
   - Look for: Consistent page views, email signups, platform clicks

2. **Daily Active Users**
   - URL: https://analytics.google.com/analytics/web/#/report/users-overview/
   - Shows: New vs returning users
   - Target Week 1: 100+ new users

3. **Page Performance**
   - URL: https://analytics.google.com/analytics/web/#/report/pages-overview/
   - Shows: Top pages, bounce rate, avg session duration
   - Expected: `/`, `/music.html`, `/connect.html` top 3

4. **Conversions**
   - URL: https://analytics.google.com/analytics/web/#/report/conversions-overview/
   - Shows: Email signups, platform clicks
   - Target Week 1: 10+ email, 65+ platform clicks

---

## Part 5: Data Collection Verification

### Week 1 Daily Checklist

**Each Day (9 AM):**
- [ ] Check GA4 Real-Time dashboard
- [ ] Verify events are flowing (page views, clicks)
- [ ] Check email signup count in Brevo
- [ ] Record daily metrics in PHASE_1_WEEK1_CONVERGENCE_BASELINE.md

**Each Week (Friday EOD):**
- [ ] Export weekly summary from GA4
- [ ] Calculate platform click breakdown
- [ ] Identify top performing pages
- [ ] Review email list growth rate

### Export Data (For Weekly Reports)

**Option 1: Manual Export**
1. GA4 > Explore > Free Form Report
2. Rows: `Page Title`, Columns: `Users`, `Sessions`
3. Download as CSV

**Option 2: Automated (If you have GA4 API access)**
```bash
# Using Google Analytics API
# Requires OAuth token setup
# See: https://developers.google.com/analytics/devguides/reporting/core/v4/quickstart
```

---

## Part 6: Troubleshooting

### Events Not Appearing in GA4

**Issue:** Page views not showing in Real-Time
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Verify gtag script is in `<head>` tag (not async-loaded)
3. Check browser console for errors
4. Confirm Property ID matches: `G-LS4G24ESNF`

**Issue:** Email signups not tracking
**Solution:**
1. Check Brevo API is returning success (200 OK)
2. Verify `gtag('event', 'email_signup', ...)` line exists
3. Check browser DevTools Network tab for gtag request

**Issue:** Platform clicks not counted
**Solution:**
1. Verify UTM parameters in URLs: `?utm_source=orbit&utm_medium=website`
2. Check GA4 filters aren't excluding traffic
3. Confirm link tracking event code in main.js

---

## Part 7: Phase 1 Goals Alignment

### Week 1 Targets (Apr 24-30)
| Target | Week 1 | Month 1 | Month 2 | Month 3 |
|--------|--------|---------|---------|---------|
| Users | 100+ | 400+ | 800+ | 1,200+ |
| Sessions | 150+ | 600+ | 1,200+ | 1,800+ |
| Email Signups | 10+ | 40+ | 80+ | 120+ |
| Platform Clicks | 65+ | 260+ | 520+ | 780+ |

### Success Metrics
- ✅ GA4 tracking live and verified
- ✅ Email signup system functional
- ✅ Platform click tracking via UTM
- ✅ Daily metric collection process established
- ✅ Real-time monitoring dashboard accessible

---

## Quick Reference

**GA4 Links:**
- Analytics Dashboard: https://analytics.google.com/analytics/web/
- Real-Time Report: https://analytics.google.com/analytics/web/#/report/realtime/
- User Overview: https://analytics.google.com/analytics/web/#/report/users-overview/
- Admin Panel: https://analytics.google.com/analytics/web/#/admin/

**Configuration Files:**
- GA4 ID: `netlify.toml` (GA4_PROPERTY_ID)
- HTML Tags: `index.html`, `about.html`, `music.html`, `connect.html`
- Event Code: `assets/js/main.js`
- Platform Links: `assets/js/platform-tracking.js`

**Testing Tools:**
- Real-Time Dashboard (1-2 sec delay)
- Browser DevTools Network tab (gtag requests)
- Brevo Dashboard (email confirmations)

---

## Next Steps

1. ✅ **Done:** GA4 property deployed to all pages
2. ⏳ **Do Now:** Create custom events in GA4 Admin (Event 1-3)
3. ⏳ **Do Now:** Test email signup and platform click tracking
4. ⏳ **Week 1:** Collect daily metrics and populate PHASE_1_WEEK1_CONVERGENCE_BASELINE.md
5. 📅 **Week 2:** Analyze results and optimize for Week 2 improvements

---

**Created:** Apr 24, 2026  
**Last Updated:** Apr 24, 2026  
**GA4 Status:** ✅ ACTIVE - Ready for Week 1 metric collection
