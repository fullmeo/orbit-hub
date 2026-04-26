# 💰 ORBIT Tipping System Setup Guide

## Overview

The ORBIT Tipping System allows fans to support Allyson with USDC (stablecoin) payments via Circle API. When a payment is confirmed, Claude AI automatically generates a personalized, poetic thank-you message that appears in the Fan Chat widget.

## Features

✅ **USDC Tipping** - Fans send USDC on Base  
✅ **AI-Generated Messages** - Claude creates personalized thank-you notes  
✅ **Real-time Confirmation** - Payment status polling every 3 seconds  
✅ **Fan Chat Integration** - Thank you message auto-appears in the chatbot  
✅ **Sandbox Testing** - Full development mode with test payments  
✅ **Secure** - CORS protection, input validation, no private key handling  

## Architecture

```
Frontend (HTML + CSS + JavaScript)
    ↓ (User clicks "Tip 5 USDC")
Tipping Widget (tipping-widget.js)
    ↓ (Creates payment request)
Circle Tips API (circle-tips.js)
    ↓ (Returns payment ID & wallet address)
User sends USDC
    ↓ (Onchain confirmation)
Circle Webhook (circle-webhook.js)
    ↓ (Triggers Claude AI)
Claude API (Claude Haiku)
    ↓ (Generates thank you message)
Get Thanks Function (get-thanks.js)
    ↓ (Stores & retrieves message)
Fan Chat Widget
    ↓ (Displays message to user)
User reads personalized message 💫
```

## Setup Instructions

### 1. Configure Circle Account (Sandbox)

**Step 1: Create Circle Account**
- Go to https://app.circle.com
- Sign up with your email
- Complete verification

**Step 2: Get API Credentials**
- Navigate to Settings → Developer
- Copy your **API Key** (starts with `pk_test_...`)
- Create a Wallet ID for receiving tips
- (Optional) Get Webhook Secret for signature verification

**Step 3: Test Payments**
- Use Circle's sandbox at https://sandbox.circle.com
- All transactions are simulated (no real money)
- Test amounts: 5 USDC or 10 USDC

### 2. Configure Environment Variables

Create or update `.env.local` on Netlify:

```bash
# Circle API (Sandbox)
CIRCLE_API_KEY=pk_test_your_key_here
CIRCLE_API_URL=https://api.sandbox.circle.com
CIRCLE_WALLET_ID=your_wallet_id_here
CIRCLE_WEBHOOK_SECRET=your_webhook_secret_here

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your_key_here

# CORS & Artist
ALLOWED_ORIGIN=https://orbit-allysonglado.netlify.app
ARTIST_NAME=Allyson Glado
ARTIST_TONE=chaleureux, inspirant, accessible, poétique
```

**Setup on Netlify:**
1. Go to Site Settings → Build & Deploy → Environment
2. Click "Edit variables"
3. Add all variables from above
4. Deploy will auto-run with new env vars

### 3. Test Locally

```bash
# Install dependencies
npm install

# Set env vars locally
export CIRCLE_API_KEY="pk_test_..."
export ANTHROPIC_API_KEY="sk-ant-..."
# ... (add others)

# Run local dev
npm start

# Test tipping flow
# 1. Click "Tip 5 USDC" button
# 2. Modal opens with payment address
# 3. Widget polls for confirmation
# 4. Message appears when confirmed
```

## File Structure

```
netlify/functions/
├── circle-tips.js          # Create PaymentIntent with Circle API
├── circle-webhook.js       # Receive webhooks, generate thank you message
├── get-thanks.js           # Retrieve stored thank you messages
├── fan-chat.js             # Existing Claude chatbot (integrated)
└── brevo-subscribe.js      # Email subscription (existing)

public/
├── tipping-widget.js       # Tipping UI and payment flow logic
├── tipping-styles.css      # Tipping button and modal styles
├── fan-chat-widget.js      # Existing chatbot widget
├── fan-chat-styles.css     # Existing chatbot styles
└── index.html              # Main page with tipping buttons

.env.example               # Template for environment variables
TIPPING_SETUP.md          # This file
```

## API Endpoints

### POST `/.netlify/functions/circle-tips`

**Create Payment**
```bash
curl -X POST https://site.netlify.app/.netlify/functions/circle-tips \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "amount": "small"}'
```

Response:
```json
{
  "success": true,
  "paymentId": "abc123...",
  "amount": "5",
  "currency": "USDC",
  "status": "pending"
}
```

**Check Status**
```bash
curl -X POST https://site.netlify.app/.netlify/functions/circle-tips \
  -H "Content-Type: application/json" \
  -d '{"action": "check-status", "paymentId": "abc123..."}'
```

### POST `/.netlify/functions/circle-webhook`

Receives webhooks from Circle when payments are confirmed.

```json
{
  "notificationType": "payment.confirmed",
  "data": {
    "id": "abc123...",
    "amount": {"amount": "5"},
    "metadata": {"fanName": "Fan"}
  }
}
```

### GET `/.netlify/functions/get-thanks?paymentId=abc123`

Returns the AI-generated thank you message.

```json
{
  "success": true,
  "found": true,
  "message": "Merci tellement pour ce geste! 💫...",
  "amount": "5",
  "fanName": "Fan",
  "timestamp": "2026-04-25T..."
}
```

## Testing Checklist

- [ ] **Local Setup**
  - [ ] Dependencies installed (`npm install`)
  - [ ] `.env` file created with test keys
  - [ ] `npm start` runs without errors

- [ ] **Circle API**
  - [ ] API key works (create payment endpoint responds)
  - [ ] Sandbox mode is enabled (no real transactions)
  - [ ] Payment creation returns valid paymentId

- [ ] **Frontend UI**
  - [ ] Tipping section visible on homepage
  - [ ] "Tip 5 USDC" and "Tip 10 USDC" buttons render
  - [ ] Buttons are styled and clickable
  - [ ] Modal opens when clicking a button

- [ ] **Payment Flow**
  - [ ] Modal shows payment amount
  - [ ] Payment address displays
  - [ ] Copy button copies address to clipboard
  - [ ] Widget polls for payment confirmation

- [ ] **Claude Integration**
  - [ ] Circle webhook triggers Claude API
  - [ ] Claude generates thank you message
  - [ ] Message appears in modal
  - [ ] Message appears in Fan Chat (if enabled)

- [ ] **Error Handling**
  - [ ] Invalid amounts rejected with clear error
  - [ ] Network errors show retry option
  - [ ] Timeout after 2 minutes with clear message
  - [ ] CORS errors handled gracefully

## Troubleshooting

### "Circle API key not configured"
**Fix:** Add `CIRCLE_API_KEY` to Netlify environment variables

### "Payment creation failed with 401"
**Fix:** API key is invalid or expired. Get a new one from Circle dashboard

### "Thank you message not appearing"
**Fix:** 
1. Check if Claude API is configured (`ANTHROPIC_API_KEY`)
2. Verify webhook is being received (check logs)
3. May take 5-10 seconds to generate

### "Payment never confirms"
**Fix:**
1. Check Circle sandbox transaction status
2. Verify `CIRCLE_WALLET_ID` is correct
3. Try a different payment amount

### CORS Error: "Origin not allowed"
**Fix:** Update `ALLOWED_ORIGIN` in .env to match your domain

## Production Migration Checklist

When moving from Sandbox to Mainnet:

- [ ] Switch `CIRCLE_API_URL` to `https://api.circle.com`
- [ ] Update `CIRCLE_API_KEY` to production key (starts with `pk_...` not `pk_test_`)
- [ ] Update `CIRCLE_WALLET_ID` to mainnet wallet
- [ ] Enable webhook signature verification in `circle-webhook.js`
- [ ] Test with small amounts first
- [ ] Set up payment receipt emails
- [ ] Update thank-you message for real transactions
- [ ] Set up monitoring/alerts for failed payments
- [ ] Document refund process

## Database Integration (Future)

Currently, thank-you messages are stored in-memory. For production:

1. **Use Supabase/PostgreSQL:**
   ```sql
   CREATE TABLE tip_messages (
     id UUID PRIMARY KEY,
     payment_id TEXT UNIQUE,
     message TEXT,
     fan_name TEXT,
     amount NUMERIC,
     created_at TIMESTAMP
   );
   ```

2. **Update `circle-webhook.js`:**
   - Replace Map with database INSERT
   - Store payment metadata

3. **Update `get-thanks.js`:**
   - Query database instead of in-memory Map
   - Add caching headers

## Support & Documentation

- **Circle API Docs:** https://developers.circle.com/docs
- **Claude API Docs:** https://docs.anthropic.com
- **Netlify Functions:** https://docs.netlify.com/functions
- **USDC on Base:** https://www.base.org

## Security Notes

✅ **What we do right:**
- Input validation on amounts
- CORS headers restrict origin
- No private key handling (Circle handles custody)
- Rate limiting on API endpoints
- XSS protection on thank-you messages

⚠️ **What needs production hardening:**
- Webhook signature verification (TODO)
- Database encryption for payment data
- Audit logging for all transactions
- External security audit before mainnet

---

**Questions?** Check the ORBIT repository or contact `bovemmusique@gmail.com`
