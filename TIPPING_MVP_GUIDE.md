# 💫 Fan Tipping MVP - Orbit Hub

## What's Working

### ✅ Features
- **Tip Buttons**: "💶 Tip 5€" and "💎 Tip 10 USDC" in fan-chat widget
- **Payment Processing**: 
  - Real Circle API if `CIRCLE_API_KEY` provided
  - Mock payments for local testing (auto-enabled if no API key)
- **AI Thank You Messages**: Claude-generated personalized responses
- **Email Collection**: Prompts fan name/email for confirmation
- **Integrated**: Directly in existing fan-chat widget (no extra clicks needed)

### 🏗️ Architecture

```
Fan clicks "Tip 5€"
     ↓
Prompts for name + email
     ↓
circle-payment.js → Creates payment intent (real or mocked)
     ↓
circle-webhook.js → Generates thank you message (Claude API)
     ↓
Shows AI response in chat
```

## Local Testing

### 1️⃣ Start Dev Server
```bash
netlify dev
```
Visit: `http://localhost:8888`

### 2️⃣ Open Fan Chat
Click the 💬 button (bottom right)

### 3️⃣ Send a Message
After bot responds, you'll see tip buttons:
- Click "💶 Tip 5€" or "💎 Tip 10 USDC"
- Enter name + email
- See mock payment flow
- View AI-generated thank you message

### Example Flow
```
You: "Love your music!"
Bot: "Thanks for the love! 💫"
[Tip buttons appear] ← Click here
Name: "Sophie"
Email: "sophie@example.com"
↓
✅ MVP Test: $5 tip processed (mocked)
[AI Message shows: "Merci Sophie! 💫..."]
```

## Deployment to Netlify

### Environment Variables Required

**Minimal** (for MVP demo):
```
ANTHROPIC_API_KEY = your_claude_api_key
```

**Full** (if you have Circle account):
```
ANTHROPIC_API_KEY = your_claude_api_key
CIRCLE_API_KEY = your_circle_api_key
CIRCLE_WEBHOOK_SECRET = your_webhook_secret
```

### Setup Steps

1. **Add to Netlify**:
   ```bash
   git push origin claude/check-orbit-hub-status-8fndE
   ```

2. **Configure Secrets**:
   - Go to: `Site Settings → Build & Deploy → Environment`
   - Add `ANTHROPIC_API_KEY`
   - (Optional) Add `CIRCLE_API_KEY` if you have Circle account

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Test on Production**:
   - Open live site
   - Open fan chat
   - Try tipping

## File Structure

```
netlify/functions/
├── circle-payment.js    # Payment intent creation
├── circle-webhook.js    # Thank you message generation
└── fan-chat.js         # Existing fan chat (unchanged)

public/
├── fan-chat-widget.js       # Existing widget (minor update)
├── fan-chat-tipping.js      # NEW: Tipping integration
└── fan-chat-styles.css      # Updated with tip button styles

index.html                   # Updated with script reference
```

## How It Works

### circle-payment.js
- Accepts: `{ amount, fanEmail, fanName }`
- Returns: `{ clientToken, intentId, isMocked }`
- If `CIRCLE_API_KEY` missing → uses mock data
- If provided → calls real Circle API

### circle-webhook.js
- Accepts: `{ fanName, fanEmail, amount, intentId }`
- Generates thank you message via Claude API
- Falls back to template if API fails
- Returns: `{ message, fanName, amount }`

### fan-chat-tipping.js
- Listens for first bot message
- Adds tip buttons to chat
- Handles tip button clicks
- Calls both functions and displays result

## What's Next (Phase 2+)

### Phase 2: Database Persistence
- [ ] Add Supabase for tip history
- [ ] Track fan preferences
- [ ] Analytics dashboard

### Phase 3: Real Circle Integration
- [ ] Implement Circle SDK in browser
- [ ] Real card payments (not mocked)
- [ ] Webhook signature verification
- [ ] Automatic wallet creation for Allyson

### Phase 4: Advanced Features
- [ ] Custom thank you messages per price tier
- [ ] Recurring tips / subscriptions
- [ ] Tip leaderboard
- [ ] Email notifications to Allyson

## Debugging

### Payment fails?
```
Check console: Open DevTools → Console tab
Look for [Payment Error] logs
```

### Thank you message doesn't appear?
```
1. Verify ANTHROPIC_API_KEY is set
2. Check Netlify Function logs:
   Site → Analytics → Functions
3. Falls back to template if Claude unavailable
```

### Mock mode test:
```
tip_amount = 5
fan_name = "TestFan"
fan_email = "test@example.com"

Should return:
{
  "success": true,
  "clientToken": "mock_token_...",
  "isMocked": true
}
```

## Testing Checklist

- [ ] Buttons appear after first message
- [ ] Can click tip buttons
- [ ] Name/email validation works
- [ ] Both payment functions return data
- [ ] Thank you message displays in chat
- [ ] Mobile view works (tip buttons stack)
- [ ] No console errors

## Support

Questions? Check:
1. Console for errors: `DevTools → Console`
2. Netlify logs: `Site → Analytics → Functions`
3. Network tab: `DevTools → Network → circle-payment / circle-webhook`

---

**Status**: ✅ MVP Ready for Testing
**Last Updated**: 2026-05-08
**Branch**: `claude/check-orbit-hub-status-8fndE`
