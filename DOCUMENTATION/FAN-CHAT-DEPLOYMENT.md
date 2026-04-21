# Fan Chat Widget - Deployment Guide

## 🚀 Complete Integration Summary

✅ **Backend:** `netlify/functions/fan-chat.js` - Secure API endpoint with rate limiting, CORS hardening, and timeout protection  
✅ **Frontend:** `public/fan-chat-widget.js` - XSS-safe widget with localStorage limits and error handling  
✅ **Styles:** `public/fan-chat-styles.css` - Accessible, responsive design with dark mode support  
✅ **Configuration:** `netlify.toml` - Security headers + function configuration  
✅ **Dependencies:** `package.json` - Anthropic SDK + build tools  
✅ **Integration:** `index.html` - Widget script and styles included  

---

## 🔐 Security Features Implemented

| Feature | Details |
|---------|---------|
| **CORS Hardening** | Restricted to `ALLOWED_ORIGIN` environment variable (blocks unauthorized origins) |
| **Rate Limiting** | 10 requests/minute per IP (prevents DOS attacks) |
| **Request Timeout** | 15-second timeout on API calls (prevents hanging requests) |
| **Input Validation** | Max 1000 chars, locale format checking, type validation |
| **XSS Prevention** | `textContent` used instead of `innerHTML` (automatically escapes HTML) |
| **Storage Limits** | Max 50 messages, 100KB limit (prevents localStorage quota errors) |
| **Security Headers** | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, etc. |
| **Error Handling** | Graceful degradation with user-friendly messages, no sensitive data exposure |

---

## 📋 Pre-Deployment Checklist

### Step 1: Environment Variables
Set these in **Netlify Dashboard** → Settings → Build & deploy → Environment:

```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
ALLOWED_ORIGIN=https://orbit-allysonglado.netlify.app
NODE_ENV=production

# Optional (for artist customization):
ARTIST_NAME=Allyson Glado
ARTIST_TONE=chaleureux, inspirant, accessible, poétique
ARTIST_BIO=Artiste reggae-pop. Émotions brutes, mélodies modernes, énergie live.
ARTIST_SPOTIFY=https://open.spotify.com/artist/7CgVDnTyDJjV0zZ5GFqdz1
ARTIST_YOUTUBE=https://www.youtube.com/channel/UCHbce4yJr6SJ_pAsvtbG7ag
ARTIST_INSTAGRAM=https://www.instagram.com/allysonglado
```

### Step 2: Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Create API key in Settings
4. Copy key and paste in Netlify environment variables
5. **DO NOT commit key to git** ❌

### Step 3: Verify Project Structure

```
orbit-hub/
├── netlify/
│   └── functions/
│       └── fan-chat.js          ✅ Backend endpoint
├── public/
│   ├── fan-chat-widget.js       ✅ Frontend widget
│   └── fan-chat-styles.css      ✅ Styles
├── index.html                   ✅ Updated with widget
├── netlify.toml                 ✅ Updated config
├── package.json                 ✅ Updated dependencies
└── ...
```

### Step 4: Install Dependencies

```bash
npm install
```

This installs:
- `@anthropic-ai/sdk` (Anthropic API client)
- `esbuild` (Function bundler)

### Step 5: Test Locally

```bash
npm start
# or
netlify dev
```

- Opens http://localhost:8888
- Function accessible at /.netlify/functions/fan-chat
- Click chat button (💬) in bottom-right to test widget
- Send test message and verify API response

### Step 6: Git Commit

```bash
git add netlify/ public/ index.html netlify.toml package.json
git commit -m "feat: Add secure fan-chat widget with AI-powered responses

- Implemented Netlify Function backend with security hardening
- Added XSS-safe frontend widget with localStorage limits
- Integrated rate limiting (10 req/min per IP) and request timeout (15s)
- Added comprehensive security headers to netlify.toml
- Updated dependencies for Anthropic SDK integration
- Full WCAG AA accessibility support + dark mode
- Replaces hardcoded responses with Claude AI responses"
```

### Step 7: Deploy

```bash
git push origin main
```

Netlify auto-deploys within 60 seconds. Monitor build at:
- https://app.netlify.com/sites/orbit-allysonglado

---

## ✅ Post-Deployment Verification

### 1. Widget Loads
```
□ Open https://orbit-allysonglado.netlify.app
□ Look for 💬 button in bottom-right corner
□ Button should pulse with animation
□ Click button → chat window appears
```

### 2. Function Works
```
□ Open browser DevTools (F12)
□ Go to Network tab
□ Click Spotify link (or send chat message)
□ See POST to /.netlify/functions/fan-chat
□ Response status: 200
□ Response includes "reply" field
```

### 3. Message Flow
```
□ Type "Hi" in chat
□ Click Send or press Enter
□ Typing indicator appears (3 dots)
□ Response appears within 2-5 seconds
□ Message persists in localStorage (reload page → messages stay)
```

### 4. Security Checks
```
□ Rate limiting: Send 15+ messages in 1 minute → 429 error
□ CORS block: Try calling function from different domain → 403 error
□ Input validation: Send 1001+ char message → 400 error
□ Timeout: Test passes (API responds within 15s)
```

### 5. Mobile Testing
```
□ Test on phone or use device emulation
□ Chat window responsive (mobile size)
□ Touch targets adequate (48px minimum)
□ Messages scroll properly
□ Send/receive works on mobile
```

---

## 🎯 Expected Behavior

### Successful Request
```
User: "Tell me about your music"

Response (via Claude):
"Thanks for asking! My music blends reggae, pop, and soul with authentic Caribbean rhythms. 
I'm all about emotional expression and live energy. You can stream my latest work on Spotify, 
Apple Music, YouTube, and all major platforms. What's your favorite genre? 🎵"
```

### Rate Limited (>10 requests/min)
```
Status: 429
Response: "Too many requests. Try again later."
```

### Invalid Input
```
Input: "<script>alert('xss')</script>"
Response: "[bot] Sorry, technical issue. Try again later! 🙏"
(Message rendered as plain text, not executed)
```

### API Timeout
```
After 15 seconds with no response:
Response: "Sorry, that took too long. Try again! 🙏"
```

---

## 🔧 Monitoring & Maintenance

### Key Metrics to Watch

**In Netlify Dashboard:**
- Build success rate (should be 100%)
- Function execution time (target: <2s)
- Bandwidth usage
- Error rates

**In Browser Console:**
- Check for [fan-chat] messages confirming initialization
- No "Widget already initialized" warnings (duplicate prevention working)
- Verify localStorage isn't exceeding 100KB

**In Network Tab (DevTools):**
- fan-chat-widget.js loads (should be cached on repeat visits)
- fan-chat-styles.css loads
- Requests to /.netlify/functions/fan-chat are fast (<2s)

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Widget doesn't appear | Script not loading | Check public/fan-chat-widget.js exists |
| "CORS error" | ALLOWED_ORIGIN not set | Set env var in Netlify Dashboard |
| "Rate limit exceeded" | Too many requests | Wait 1 minute between requests |
| Messages not persisting | localStorage disabled | Browser privacy mode disables it |
| Timeout error | API slow | Check Anthropic API status |
| XSS attempt renders as text | Working correctly! | textContent prevents injection ✅ |

---

## 🚀 Scaling to Next ORBIT Artist

To add fan-chat for another artist:

1. **Update environment variables** in Netlify:
   ```
   ARTIST_NAME=New Artist
   ARTIST_TONE=personality traits
   ARTIST_BIO=artist bio
   ARTIST_SPOTIFY=https://...
   ARTIST_YOUTUBE=https://...
   # etc.
   ```

2. **No code changes needed!** - Backend reads from environment

3. **Test in development:**
   ```bash
   ARTIST_NAME="Test Artist" npm start
   ```

4. **Deploy:** Git push triggers automatic deployment

---

## 📖 Additional Documentation

- **Security Review:** See `REVIEW_AND_IMPROVEMENTS.md` in Downloads folder
- **Rate Limiting:** Uses in-memory store; upgrade to Redis for distributed setup
- **Production Scaling:** Consider using external rate limiting service at scale
- **Analytics:** Fan-chat responses can be logged (with privacy considerations)

---

## 🎉 Fan Chat Integration Complete!

The fan-chat widget is now:
- ✅ Secure (CORS hardened, rate limited, timeout protected)
- ✅ User-friendly (XSS-safe, localStorage persisted, offline-aware)
- ✅ Accessible (WCAG AA, keyboard nav, screen reader support)
- ✅ Performant (lazy loaded, optimized API calls)
- ✅ Scalable (environment-driven, works for any artist)

**Status:** Ready for production on orbit-allysonglado.netlify.app 🚀
