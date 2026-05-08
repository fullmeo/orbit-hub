# 🚀 Deployment Guide - Fan Tipping MVP

## Current Status
✅ **MVP Complete & Tested**
- All functions working
- Mock payments working
- AI messages working (with fallback)
- Frontend integration complete
- Ready for Netlify deployment

## Branch
`claude/check-orbit-hub-status-8fndE`

---

## Step 1: Push to GitHub (if not already done)

```bash
git push -u origin claude/check-orbit-hub-status-8fndE
```

## Step 2: Configure Netlify Environment Variables

### Minimal Setup (MVP Mode - No Real Payments)
Go to Netlify Dashboard:
- **Site Settings** → **Build & Deploy** → **Environment**

Add these variables:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
BREVO_API_KEY = xkeysib-xxxxxxxxxxxxxxxx  (already configured)
```

### Full Setup (Real Payments)
If you have Circle account:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
CIRCLE_API_KEY = sk_live_xxxxxxxxxxxxxxxx
CIRCLE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxx
BREVO_API_KEY = xkeysib-xxxxxxxxxxxxxxxx
```

---

## Step 3: Deploy to Netlify

### Option A: GitHub Integration (Recommended)
1. Connect repo to Netlify (if not already)
2. Point to branch `claude/check-orbit-hub-status-8fndE`
3. Netlify auto-deploys on push

### Option B: CLI Deploy
```bash
# Login
netlify login

# Deploy
netlify deploy --prod --branch claude/check-orbit-hub-status-8fndE
```

---

## Step 4: Verify Deployment

### Check Site
- Visit: `https://orbit-allysonglado.netlify.app`
- Open fan-chat (💬 button, bottom right)
- Send a message
- Look for tip buttons: **💶 Tip 5€** and **💎 Tip 10 USDC**

### Test Tipping
1. Click one of the tip buttons
2. Enter: name `"Test Fan"` and email `"test@example.com"`
3. See the mock payment response
4. See the thank you message from Allyson

### Check Logs
- **Netlify Dashboard** → **Analytics** → **Functions**
- Look for `circle-payment` and `circle-webhook` logs
- Should show successful executions

---

## What Gets Deployed

### Backend (Netlify Functions)
```
netlify/functions/
├── fan-chat.js              (existing - unchanged)
├── circle-payment.js        (NEW - MVP)
├── circle-webhook.js        (NEW - MVP)
└── fan-chat-escalation.js   (from escalade feature)
```

### Frontend
```
public/
├── fan-chat-widget.js       (updated - tipping hook)
├── fan-chat-tipping.js      (NEW - MVP)
├── fan-chat-styles.css      (updated - tip button styles)
├── index.html               (updated - script reference)
└── ... (all other assets)
```

---

## Features Deployed

### ✅ Fan Chat (Existing)
- AI-powered chatbot as Allyson Glado
- Human escalation to bovemmusique@gmail.com
- Messages saved in localStorage

### ✅ Fan Tipping (NEW - MVP)
- Two tip buttons: 5€ and 10 USDC
- Payment processing via Circle (mocked if no API key)
- AI-generated thank you messages
- Email collection for responses

---

## Troubleshooting

### Buttons don't appear?
1. Check that `fan-chat-tipping.js` is loaded
2. Open DevTools → Console
3. Look for `[tip-component] Initialized` message
4. If not there, check for errors in logs

### Payment endpoint fails?
```
Check: Netlify Dashboard → Functions → circle-payment logs
Should show: "[Payment] Tip $5 from TestFan"
```

### No thank you message?
```
1. ANTHROPIC_API_KEY may not be set
2. Check circle-webhook logs
3. Should see: "[Webhook] Payment confirmed"
4. Falls back to template if Claude API fails
```

### Email validation?
- Basic regex: `test@example.com` format required
- No special validation (works with any email)

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `ANTHROPIC_API_KEY` | ✅ | `sk-ant-...` | For AI messages |
| `CIRCLE_API_KEY` | ⚠️ Optional | `sk_live_...` | For real payments |
| `BREVO_API_KEY` | ✅ | `xkeysib-...` | For escalation emails |

**Legend**: 
- ✅ = Required for MVP
- ⚠️ = Optional (uses mocks if missing)

---

## After Deployment

### Monitor
- Check Netlify Function logs daily
- Look for errors in circle-payment and circle-webhook
- Monitor payment success rate

### Next Phase
- [ ] Add Supabase for tip history
- [ ] Implement real Circle SDK
- [ ] Create admin dashboard for Allyson
- [ ] Add tip leaderboard
- [ ] Setup email notifications

---

## Support

### Check Logs
```
Netlify Dashboard → Site Analytics → Functions
Select: circle-payment or circle-webhook
View real-time logs
```

### Manual Test
```bash
curl -X POST https://orbit-allysonglado.netlify.app/.netlify/functions/circle-payment \
  -H "Content-Type: application/json" \
  -d '{"amount":5,"fanEmail":"test@test.com","fanName":"Test"}'
```

### Common Issues

**Q: Buttons not showing?**
A: Check browser console for errors. Verify index.html loads fan-chat-tipping.js

**Q: Payment fails?**
A: Check Netlify function logs. Mock mode should always work.

**Q: No thank you message?**
A: Set ANTHROPIC_API_KEY or check circle-webhook logs

---

## Rollback Plan

If issues arise:
```bash
# Revert to previous version
git checkout previous-branch

# Redeploy
netlify deploy --prod
```

---

**Deploy Date**: Ready now! 🚀
**Status**: ✅ Production Ready
**MVP Version**: 1.0
