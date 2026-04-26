# 🚀 Deployment Guide - USDC Tipping System

## Pre-Deployment Checklist

- [ ] All files created and in place
- [ ] Environment variables configured on Netlify
- [ ] Circle API credentials obtained
- [ ] Anthropic API key obtained
- [ ] Local testing completed successfully
- [ ] No console errors in browser DevTools
- [ ] All tipping buttons visible and clickable

## Files Added/Modified

### ✅ New Files Created
```
netlify/functions/
├── circle-tips.js              (215 lines) - Create USDC payments
├── circle-webhook.js           (183 lines) - Process confirmations + Claude AI
└── get-thanks.js               (65 lines)  - Retrieve thank you messages

public/
├── tipping-widget.js           (320 lines) - Tipping UI and payment flow
├── tipping-styles.css          (420 lines) - Tipping button and modal styles

Documentation/
├── TIPPING_SETUP.md            - Detailed technical setup guide
├── TIPPING_README.md           - Quick start and testing guide
└── DEPLOYMENT.md               - This file
```

### ✅ Files Modified
```
index.html
├── Added tipping-styles.css import
├── Added tipping section with buttons
├── Added tipping-widget.js script
└── Added TIPPING_CONFIG

public/fan-chat-widget.js
├── Added FAN_CHAT_INJECTOR export
├── Added tipping buttons to chat widget
└── Auto-opens chat when payment received

public/fan-chat-styles.css
├── Added styles for tipping buttons in chat
└── Added action area styling

.env.example
└── Updated with Circle API variables
```

## Step-by-Step Deployment

### 1️⃣ Prepare Credentials

**Get Circle API Key (Sandbox)**
```
1. Go to https://app.circle.com
2. Sign up / Log in
3. Settings → Developer
4. Copy API Key (starts with pk_test_...)
5. Create or note your Wallet ID
```

**Get Anthropic API Key**
```
1. Go to https://console.anthropic.com
2. Create account / Log in
3. API Keys section
4. Create new key (starts with sk-ant-...)
```

### 2️⃣ Configure Netlify Environment Variables

**Via Netlify Dashboard:**
```
1. Go to Site Settings
2. Build & Deploy → Environment
3. Edit variables (or add via command line)
4. Add each variable below
5. Click "Deploy site" to rebuild
```

**Environment Variables to Add:**
```
CIRCLE_API_KEY=pk_test_your_key_here
CIRCLE_API_URL=https://api.sandbox.circle.com
CIRCLE_WALLET_ID=your_wallet_id_here
CIRCLE_WEBHOOK_SECRET=your_webhook_secret_here (optional for now)

ANTHROPIC_API_KEY=sk-ant-your_key_here

ALLOWED_ORIGIN=https://orbit-allysonglado.netlify.app
ARTIST_NAME=Allyson Glado
ARTIST_TONE=chaleureux, inspirant, accessible, poétique
```

### 3️⃣ Deploy Code

**Option A: Git Push (Recommended)**
```bash
# From project directory
cd /path/to/orbit-hub

# Check status
git status

# Add all changes
git add -A

# Commit
git commit -m "feat: Implement USDC tipping via Circle + AI thank you messages"

# Push to main
git push origin main

# Netlify auto-deploys in ~1-2 minutes
```

**Option B: Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### 4️⃣ Verify Deployment

**Check Build Status:**
```
1. Go to Netlify dashboard
2. Deployments section
3. Wait for "Published" status (should be green ✅)
```

**Test in Browser:**
```
1. Go to https://orbit-allysonglado.netlify.app
2. Scroll to "Support Allyson's Music" section
3. Click "Tip 5 USDC" button
4. Modal should open showing payment details
```

**Check for Errors:**
```
1. Open browser DevTools (F12)
2. Console tab - should be clean (no red errors)
3. Network tab - API calls should return 200
4. Application → LocalStorage - fan_chat_messages should exist
```

## Testing the Complete Flow

### Test Scenario 1: Basic Button Click
```
1. Click "Tip 5 USDC" button
2. ✅ Modal opens
3. ✅ Amount shows "5 USDC on Base"
4. ✅ Copy button works
5. Close modal
```

### Test Scenario 2: Error Handling
```
1. Temporarily disable API key in Netlify
2. Click "Tip 5 USDC"
3. ✅ Error message appears: "Circle API key not configured"
4. Re-enable API key
5. Try again - should work
```

### Test Scenario 3: Timeout Handling
```
1. Click "Tip 10 USDC"
2. Wait 2 minutes without sending payment
3. ✅ Shows "Payment check timed out" message
4. Offers option to try again
```

### Test Scenario 4: Chat Integration
```
1. Click tipping button in Chat widget
2. Modal opens
3. Close modal
4. ✅ Tipping buttons are visible in chat
5. Try clicking both buttons
6. ✅ Both work correctly
```

## Monitoring & Support

### Check Logs
```bash
# Via Netlify CLI
netlify logs

# Via Netlify Dashboard
Site Settings → Deploy logs
```

### Monitor Errors
```
Netlify Dashboard → Functions → View logs
Look for: [Circle] [Anthropic] [Unhandled Error]
```

### Test API Endpoints
```bash
# Test circle-tips function
curl -X POST https://orbit-allysonglado.netlify.app/.netlify/functions/circle-tips \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "amount": "small"}'

# Should return:
# {"success": true, "paymentId": "...", "amount": "5", ...}
```

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous commit
git revert HEAD

# Push to trigger redeploy
git push origin main

# Or disable the functions temporarily
# Netlify Dashboard → Functions → Disable until fixed
```

## Post-Deployment Tasks

- [ ] Send test tip to confirm flow works
- [ ] Share deployment link with team
- [ ] Update analytics with new goal (tipping conversion)
- [ ] Document wallet address where tips are received
- [ ] Set up monitoring alerts for failed payments

## Troubleshooting Deployment Issues

### "Functions not available"
**Fix:** 
1. Make sure netlify.toml exists in root
2. Check netlify/functions directory exists
3. Redeploy site

### "CORS error in browser"
**Fix:**
1. Check `ALLOWED_ORIGIN` is set correctly
2. If using localhost, set to `http://localhost:3000`
3. If production, set to `https://orbit-allysonglado.netlify.app`

### "API key not found"
**Fix:**
1. Go to Netlify dashboard
2. Site Settings → Environment
3. Verify variables are saved (sometimes requires page refresh)
4. Redeploy site

### "Thank you message not appearing"
**Fix:**
1. Check `ANTHROPIC_API_KEY` is set
2. Check function logs for Claude errors
3. Verify webhook is being called (add console.log)

## Production Readiness

When ready to go live with real payments:

### Switch from Sandbox to Mainnet
```
1. Get production Circle API key
2. Update CIRCLE_API_URL to: https://api.circle.com
3. Update CIRCLE_API_KEY with production key
4. Update CIRCLE_WALLET_ID to mainnet wallet
5. Redeploy
```

### Enable Webhook Signature Verification
```javascript
// In circle-webhook.js, uncomment signature verification
// See TIPPING_SETUP.md for details
```

### Set Up Database
```sql
-- Create Supabase table for messages
CREATE TABLE tip_messages (
  id UUID PRIMARY KEY,
  payment_id TEXT UNIQUE,
  message TEXT,
  fan_name TEXT,
  amount NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Add Monitoring
- [ ] Set up error alerts
- [ ] Log all payments
- [ ] Monitor API latency
- [ ] Track conversion rates

## Support Resources

- **Netlify Docs:** https://docs.netlify.com
- **Circle API:** https://developers.circle.com/docs
- **Claude API:** https://docs.anthropic.com
- **TIPPING_SETUP.md** - Detailed technical guide
- **TIPPING_README.md** - Quick start guide

---

**Deployment Complete!** 🎉

Your USDC tipping system is now live. Fans can start supporting Allyson's music with USDC payments, and they'll receive personalized AI-generated thank you messages!
