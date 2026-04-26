# 🎨 ORBIT 2.0 WIDGET VALIDATION SPECIFICATION
## publicfan-chat-widget.js ↔ KiloClaw Integration

**Version:** 1.0 (Validation)  
**Date:** 26 April 2026  
**Widget:** publicfan-chat-widget.js  
**Architecture:** ORBIT 2.0 + KiloClaw Hybrid Validator  
**Status:** VALIDATION IN PROGRESS

---

## PART I: WIDGET OVERVIEW

### Current Flow (From Code Analysis)

```
USER INTERACTION:
├─ Click "Tip 5€" button
│  └─ openTipModal(5, "EUR") → Creates overlay modal
├─ POST /.netlify/functions/circle-tips (Create PaymentIntent)
│  ├─ Body: { amount: 5, tipperName: "Fan" }
│  ├─ Response: { paymentIntentId: "..." }
│  └─ Status: awaiting wallet address
├─ Poll /.netlify/functions/circle-tips?id=... every 3s
│  ├─ Retrieves wallet address when ready
│  ├─ Shows address to user (copy-to-clipboard)
│  └─ Polling timeout: 5 minutes
├─ User manually sends USDC/EUR to address
│  ├─ Off-chain transfer (wallet → artist wallet)
│  └─ Widget polls for confirmation
└─ Poll /.netlify/functions/get-thanks every 10s
   ├─ Retrieves AI-generated thank you messages
   └─ Displays as chat bubbles

ALSO INCLUDES:
├─ Fan Chat (ask questions about artist)
│  └─ POST /.netlify/functions/fan-chat
└─ Inline tip section on main page
   └─ Injected after streaming links
```

---

## PART II: CRITICAL DESIGN QUESTIONS (MUST LOCK)

### Question 1: Is a Tipper an Agent?

**Context:** ORBIT 2.0 defines three agent types:
1. Caption Generator agents (your PWA)
2. User-Created agents (x402-native, fans creating discovery bots)
3. Orchestration agents (Kilo/Sonnet background)

**Question:** When a fan clicks "Tip 5€", should we:

**(A) NOT create an agent**
- Tipping is a simple payment (outside agent system)
- Tipper doesn't need JWT or x402 signature
- No KiloClaw validation
- Records: Just a payment in ORBIT.payments table
- Trade-off: Can't track tipper behavior, no fraud detection for repeat tippers

**(B) Create a temporary agent per tip**
- Each tip creates an agentId
- Agent runs through KiloClaw Stage 1 (quick validation)
- Agent status: TRANSIENT (expires after tip confirmation)
- Records: agent_query_log entry
- Trade-off: Overhead for one-time transactions

**(C) Create a persistent agent (Fan Chat Agent)**
- Fan registers once ("Create Agent" button)
- All tips + chats use same agentId
- Full KiloClaw validation (Stage 1 + 2)
- Agent status: ACTIVE (persists across sessions)
- Records: Fan becomes trackable (behavior scoring, trust tier)
- Trade-off: Higher friction (fan must register first)

**RECOMMENDATION:** I suggest **(C) — Create persistent Fan Chat Agent**

**Rationale:**
- Aligns with ORBIT philosophy (agents are persistent, trusted entities)
- Enables fraud detection (KiloClaw scores repeat tippers)
- Better UX (register once, tip as many times as you want)
- Supports future features (fan loyalty tiers, referral rewards)

---

### Question 2: Currency Routing

**Current Widget Support:**
- EUR: Via "Tip 5€" button
- USDC: Via "Tip 10 USDC" button

**Question:** Which currency flows through which backend?

**Option A: EUR via Stripe, USDC via Circle**
```
Tip 5€ → Stripe → Artist EUR bank account
Tip 10 USDC → Circle → Artist USDC wallet
```

**Option B: Both via Circle (convert EUR to USDC)**
```
Tip 5€ → Stripe on-ramp (EUR → USDC) → Circle → Artist USDC wallet
Tip 10 USDC → Circle → Artist USDC wallet
```

**Option C: Both via Stripe (different endpoints)**
```
Tip 5€ → Stripe → Artist EUR bank account
Tip 10 USDC → Stripe → USDC wallet (if supported)
```

**RECOMMENDATION:** I suggest **Option B — Both via Circle USDC**

**Rationale:**
- Unified settlement layer (all artist payments in one wallet)
- Atomic x402 payments (consistent with ORBIT architecture)
- Easier reconciliation (single ledger for artist)
- EUR → USDC conversion via Stripe on-ramp (simple, regulated)

---

### Question 3: Fan Chat Interaction

**Current Widget:** Fan can ask questions (bio, streaming links, dates, merch)

**Question:** Should chat interactions be tracked as agent queries?

**Option A: Chat is separate from agent system**
- Chat requests go to /.netlify/functions/fan-chat
- No agent validation, no payment
- Just information delivery (free service)

**Option B: Chat interactions cost microcents**
- Each chat query = €0.01 (or USDC equivalent)
- Fan's tip budget includes chat (e.g., 5€ covers multiple chats + tips)
- KiloClaw validates each query

**Option C: Chat is premium feature (paid)**
- Free users get 5 chats/month
- Premium agents (after 10 tips) get unlimited chats
- Encourages repeat tipping

**RECOMMENDATION:** I suggest **Option A — Chat is free**

**Rationale:**
- Builds engagement (fans ask → get answers → decide to tip)
- Lower friction (no payment barrier to interaction)
- Provides data (what fans ask about)
- Can upsell later (premium chat features)

---

## PART III: MAPPED ARCHITECTURE

### 3.1 Fan Chat Agent Registration Flow

```
STEP 1: Fan Opens Widget
├─ Widget detects no agentId in localStorage
├─ Shows: "Welcome! Create your Fan Agent to support [Artist]"
└─ Button: "Create Fan Agent"

STEP 2: Fan Clicks "Create Fan Agent"
├─ Opens modal (similar to x402 payment modal)
├─ Fan enters:
│  ├─ Name (e.g., "Alice Fan")
│  ├─ Email (for receipts)
│  └─ Choose currency (EUR via Stripe, USDC via wallet)
├─ Widget POSTs to /orbit/agents/register
│  ├─ Body: { name, email, currency, artistId, agentType: "fan_chat" }
│  └─ Response: { agentId, jwtToken, walletAddress (if USDC) }
├─ Widget stores agentId + jwtToken in localStorage
└─ Display: "Agent created! You're all set 💜"

STEP 3: Fan Can Now Tip or Chat
├─ All subsequent requests include agentId + jwtToken
├─ KiloClaw Stage 1 validates (JWT, status, permissions)
└─ KiloClaw Stage 2 analyzes behavior (asynchronously)
```

### 3.2 Tipping Flow (With Agent Integration)

```
TIMELINE: Fan clicks "Tip 5€"

T+0s: WIDGET INITIATES TIP
├─ agentId: read from localStorage
├─ currency: "EUR"
├─ amount: 5
└─ Call openTipModal(5, "EUR")

T+0.1s: KILCLAW STAGE 1 (Widget-side validation, optional)
├─ Check agentId status (is agent ACTIVE?)
├─ Check artist blocks this agent?
├─ Check daily tip limit?
└─ If any check fails: Show error, don't proceed

T+0.2s: CREATE PAYMENT INTENT
├─ POST /orbit/payments/create
│  ├─ Body: {
│  │    agentId,
│  │    jwtToken,
│  │    artistId,
│  │    amount: 5,
│  │    currency: "EUR",
│  │    paymentType: "tip"
│  │  }
│  └─ Response: { paymentId, walletAddress, expiresAt }
├─ Database: INSERT into pending_payments
│  ├─ status: "pending"
│  ├─ paymentId, agentId, artistId, amount
│  └─ created_at: now
└─ Show wallet address to fan

T+0.5s: FAN SENDS PAYMENT (Manual)
├─ EUR option: Fan enters Stripe card → instant Stripe charge
├─ USDC option: Fan manually sends from wallet
└─ Widget polls for confirmation

T+1.0s onwards: POLL FOR CONFIRMATION (every 3s)
├─ GET /orbit/payments?id={paymentId}
├─ Check if payment settled (via Circle webhook or Stripe)
└─ When settled:
   ├─ status: "completed"
   ├─ transactionHash: "0x..."
   ├─ artist receives: 80% (€4)
   ├─ platform receives: 20% (€1)
   └─ agent_query_log entry created
      └─ queryType: "tip", cost: €5, etc.

T+2.5s onwards: KILCLAW STAGE 2 (Async, non-blocking)
├─ Background job analyzes agent behavior
├─ Kilo model scores tipper (100 previous tips, spending pattern, etc.)
├─ Behavior score: 85/100 (normal, trusted)
├─ No anomalies detected
└─ Agent remains ACTIVE

T+10s: POLL FOR THANK YOU MESSAGE
├─ GET /.netlify/functions/get-thanks
├─ Returns: { thanks: [{ message: "🎵 Merci Alice! [Artist] dit: ..." }] }
└─ Display as chat bubble: "🎵 [message]"
```

### 3.3 Chat Query Flow

```
FAN TYPES: "What's your latest album?"

TIMELINE: T+0s to T+2s

T+0s: WIDGET SENDS QUERY
├─ agentId: from localStorage
├─ jwtToken: from localStorage
├─ message: "What's your latest album?"
└─ POST /.netlify/functions/fan-chat
   ├─ Body: {
   │    agentId,
   │    jwtToken,
   │    message,
   │    artistId
   │  }
   └─ KILCLAW STAGE 1 (Backend):
      ├─ Verify JWT
      ├─ Verify agentId status
      ├─ Check agent not rate-limited (100 chats/hour?)
      └─ If valid: Continue

T+0.1s: FAN-CHAT HANDLER
├─ Query artist data (bio, albums, links)
├─ Route to Magnus orchestrator or Claude Haiku
├─ Generate response: "Latest album: [Album Name] (2026)"
└─ Return response

T+1s: WIDGET DISPLAYS RESPONSE
├─ Show as bot message: "Your latest album is..."
└─ Record as "chat" interaction (NOT a payment)

KILCLAW STAGE 2:
├─ Logs chat interaction (for behavior analysis)
├─ Updates agent activity timestamp
├─ No fraud detection (free interaction)
```

---

## PART IV: DATABASE SCHEMA EXTENSIONS

### 4.1 New Tables for Widget

```typescript
// agents_fan table (extends agents table, for fan-specific data)
table agents_fan {
  id: UUID                    // agentId (FK → agents.id)
  artist_id: UUID             // Which artist this fan follows
  fan_name: string            // "Alice Fan"
  fan_email: string           // alice@example.com
  preferred_currency: enum    // 'EUR' | 'USDC'
  
  total_tips_count: bigint    // Lifetime tips
  total_tips_amount_usd: decimal  // Sum in USD equivalent
  
  last_tip_at: timestamp
  last_chat_at: timestamp
  
  fan_tier: enum              // 'FAN' | 'SUPER_FAN' | 'PATRON'
  // Based on total_tips_amount_usd:
  // FAN: €0-50, SUPER_FAN: €50-500, PATRON: €500+
  
  created_at: timestamp
  updated_at: timestamp
}

// payments table (new, for tipping)
table payments {
  id: UUID                    // paymentId
  agent_id: UUID              // Which fan sent it
  artist_id: UUID             // Which artist receives it
  
  amount: decimal             // Original amount
  currency: enum              // 'EUR' | 'USDC'
  amount_usd_equivalent: decimal  // For reporting
  
  payment_type: enum          // 'tip' | (future: 'merchandise', 'subscription')
  
  status: enum                // 'pending' | 'completed' | 'failed'
  
  stripe_charge_id?: string   // If EUR via Stripe
  x402_transaction_hash?: string  // If USDC via Circle
  
  artist_received: decimal    // 80% of amount
  platform_fee: decimal       // 20% of amount
  
  created_at: timestamp
  completed_at?: timestamp
}

// fan_chat_interactions table (extends agent_query_log)
table fan_chat_interactions {
  id: UUID
  agent_id: UUID              // Which fan
  artist_id: UUID
  
  message_from_fan: string    // "What's your latest album?"
  response_from_claude: string // "Your latest album is..."
  
  response_time_ms: integer
  
  created_at: timestamp
}
```

---

## PART V: KILCLAW INTEGRATION POINTS

### 5.1 Where KiloClaw Validates

```
STAGE 1: Pre-Check (Widget or Backend, <100ms)

When: Before any payment or chat
Where: Backend /.netlify/functions/* handlers
Check:
  ├─ JWT valid? (verify signature + expiration)
  ├─ agentId exists? (lookup in DB)
  ├─ Agent status = ACTIVE? (not BLOCKED, SUSPENDED, etc.)
  ├─ Artist blocked this agent? (lookup artist_agent_permissions)
  ├─ Rate limits OK? (daily tips limit, chat limit)
  └─ Result: APPROVE or REJECT

If APPROVED:
  └─ Proceed to payment/chat handler

If REJECTED:
  ├─ Log security event
  ├─ Return error to widget
  └─ Widget shows: "❌ You can't tip right now"

───────────────────────────────────────────

STAGE 2: Post-Check (Async, ~1.4s after payment)

When: After payment settled (asynchronously)
Where: Background job (not blocking widget)
Analyze:
  ├─ Agent's tip history (past 100 tips)
  ├─ Spending velocity (€X per day, €Y per week)
  ├─ Artist concentration (% tips to single artist)
  ├─ Time-of-day patterns (unusual hours?)
  ├─ Amount consistency (spikes?)
  └─ Kilo model routing:
     ├─ <10 tips: xai (fast)
     ├─ 10-100 tips: mistral (balanced)
     └─ >100 tips: kawaipilot (specialist)

Update:
  ├─ agents.behavior_score
  ├─ agents_fan.total_tips_count
  ├─ agents_fan.total_tips_amount_usd
  ├─ agents_fan.fan_tier (if crossed threshold)
  └─ Log anomalies if detected
```

### 5.2 KiloClaw Validators (Code Stubs)

```typescript
/**
 * STAGE 1: Validate fan before tipping
 * Called by: POST /orbit/payments/create
 */
async function kiloClawValidateFanTip(
  agentId: string,
  jwtToken: string,
  artistId: string,
  amount: number
): Promise<ValidationResult> {
  // Check 1: JWT validity
  const decoded = verifyJWT(jwtToken);
  if (!decoded || decoded.expiresAt < Date.now()) {
    return { approved: false, reason: "JWT_INVALID_OR_EXPIRED" };
  }
  
  // Check 2: Agent exists and active
  const agent = await db.agents.findById(agentId);
  if (!agent || agent.status !== "ACTIVE") {
    return { approved: false, reason: "AGENT_NOT_ACTIVE" };
  }
  
  // Check 3: Artist hasn't blocked this agent
  const permission = await db.artist_agent_permissions.findOne({
    artist_id: artistId,
    agent_id: agentId
  });
  if (permission && !permission.can_access) {
    return { approved: false, reason: "ARTIST_BLOCKED_AGENT" };
  }
  
  // Check 4: Daily tip limit
  const tipsToday = await db.payments.countByDay(agentId, artistId);
  const dailyLimit = permission?.daily_query_limit ?? 10; // Default: 10 tips/day
  if (tipsToday >= dailyLimit) {
    return { approved: false, reason: "DAILY_TIP_LIMIT_EXCEEDED" };
  }
  
  // All checks passed
  logAuditTrail({
    action: "KILCLAW_FAN_TIP_APPROVED",
    agentId,
    artistId,
    amount,
    timestamp: Date.now()
  });
  
  return { approved: true, reason: "APPROVED" };
}

/**
 * STAGE 2: Analyze fan behavior after tip
 * Called by: Background job (after payment confirmed)
 */
async function kiloClawAnalyzeFanBehavior(
  agentId: string,
  newPayment: PaymentRecord
): Promise<BehaviorAnalysis> {
  
  const agent = await db.agents.findById(agentId);
  const fanData = await db.agents_fan.findById(agentId);
  
  // Extract feature vector
  const features = {
    total_tips: fanData.total_tips_count,
    total_amount_usd: fanData.total_tips_amount_usd,
    tip_frequency: fanData.total_tips_count / daysActive(agent.created_at),
    last_tip_recency: Date.now() - fanData.last_tip_at,
    artist_concentration: (await db.payments.countByArtist(agentId, newPayment.artist_id)) / fanData.total_tips_count,
    amount_deviation: Math.abs(newPayment.amount_usd_equivalent - avgTipAmount(agentId)),
    time_of_day: new Date().getHours()
  };
  
  // Route to Kilo model
  const model = fanData.total_tips_count < 10 ? "xai" : "mistral";
  
  const kiloResponse = await kiloDispatch({
    sessionId: `orbit-fan-behavior-${agentId}`,
    model,
    task: "fan_behavior_analysis",
    payload: {
      intention: "Detect anomalies in fan tipping behavior",
      features,
      threshold: 40 // Score below 40 = suspicious
    }
  });
  
  // Update agent scoring
  await db.agents.update(agentId, {
    behavior_score: kiloResponse.behavior_score
  });
  
  // Update fan tier if applicable
  if (fanData.total_tips_amount_usd >= 500) {
    await db.agents_fan.update(agentId, { fan_tier: "PATRON" });
  } else if (fanData.total_tips_amount_usd >= 50) {
    await db.agents_fan.update(agentId, { fan_tier: "SUPER_FAN" });
  }
  
  return {
    behaviorScore: kiloResponse.behavior_score,
    anomalies: kiloResponse.detected_anomalies,
    action: kiloResponse.behavior_score < 40 ? "QUARANTINE" : "ALLOW"
  };
}
```

---

## PART VI: WIDGET CODE CHANGES (Required for ORBIT Integration)

### 6.1 Current Widget Issues

| Line(s) | Issue | ORBIT Fix |
|---------|-------|-----------|
| 5-6 | No agent registration | Add endpoint: POST /orbit/agents/register |
| 245 | POST creates PaymentIntent, but no agentId | Add agentId to body |
| 248 | tipperName hardcoded as "Fan" | Use agent.fan_name instead |
| 261-287 | Poll without JWT validation | Add jwtToken header to poll requests |
| 314-330 | Thanks polling works, but no agent tracking | Log fan interaction as agent_query_log |
| — | No error recovery for poll failures | Add retry logic (exponential backoff) |

### 6.2 Minimal Changes for ORBIT Integration

```javascript
// CHANGE 1: Add agent registration on first load
if (!localStorage.getItem('orbitAgentId')) {
  // Show registration modal
  // POST /orbit/agents/register
  // Store agentId + jwtToken in localStorage
}

// CHANGE 2: Include agentId + JWT in tip request
fetch(TIP_API, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem('orbitJWT')}`
  },
  body: JSON.stringify({
    agentId: localStorage.getItem('orbitAgentId'),
    amount,
    currency,
    artistId  // Add this
  })
})

// CHANGE 3: Include agentId in chat requests
fetch("/.netlify/functions/fan-chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem('orbitJWT')}`
  },
  body: JSON.stringify({
    agentId: localStorage.getItem('orbitAgentId'),
    message: text,
    locale: navigator.language || "fr-FR",
    artistId  // Add this
  })
})
```

---

## PART VII: VALIDATION CHECKLIST

### ✅ Current Widget (Already Good)

- [x] Launcher button (fixed position, easy toggle)
- [x] Chat interface (messages flow, auto-scroll)
- [x] Tip buttons (clear call-to-action, gradient UI)
- [x] Payment modal (wallet address display, copy-to-clipboard)
- [x] Polling (3s interval for payment confirmation)
- [x] Thank you messages (async polling, chat display)
- [x] Inline tip section (injected on main page)
- [x] Responsive design (mobile-friendly)
- [x] Error handling (try-catch, fallback messages)

### ⚠️ Must Add for ORBIT Integration

- [ ] Agent registration flow (first-time setup)
- [ ] localStorage for agentId + jwtToken
- [ ] Authorization headers (JWT) on all API calls
- [ ] artistId parameter on all requests
- [ ] KiloClaw Stage 1 validation (pre-tip check)
- [ ] Error messages for REJECTED tips (agent blocked, limit exceeded)
- [ ] Behavior tracking (log tips in agent_query_log)
- [ ] Fan tier display (show "PATRON" badge if applicable)
- [ ] Retry logic for failed polls (exponential backoff)

### 🔒 Security Requirements

- [ ] JWT validation on backend (every API call)
- [ ] Rate limiting (max 10 tips/day per fan/artist)
- [ ] Signature verification (x402 for USDC payments)
- [ ] CSRF protection (token rotation)
- [ ] Input validation (amount, currency, artistId)
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS prevention (no innerHTML with user input)

---

## PART VIII: CONVERGENCE VALIDATION

### Widget Convergence Analysis

#### **Pillar 1: Intent Fidelity (Recognition)**

**Original Intent:**
- Fan can tip artist directly from ORBIT instance
- Tipping is integrated into chat widget
- Artist receives thanks message (via AI)
- Simple one-click UX (minimal friction)

**Delivered (Current Widget):**
- ✅ Tip button accessible in chat panel
- ✅ Payment modal with wallet address
- ✅ AI thanks messages display in chat
- ✅ Copy-to-clipboard (user-friendly)
- ⚠️ Missing: Agent registration (pre-requisite)
- ⚠️ Missing: KiloClaw validation (safety)

**Pillar 1 Score: 78/100** (below 80 threshold due to missing agent layer)

---

#### **Pillar 2: Optimal Design (Elegance)**

**Design Quality (Current):**
- ✅ Smooth animations, gradient colors, modern UI
- ✅ Modal flow (clear, focused on one task)
- ✅ Polling strategy (non-blocking, 3s interval)
- ⚠️ Registration flow missing (adds friction)
- ⚠️ No error recovery (polling can get stuck)
- ⚠️ localStorage without encryption (security risk)

**Pillar 2 Score: 74/100** (below 80 due to UX friction + security gaps)

---

#### **Pillar 3: Code Consistency (Magnus Safeguards)**

**Current Widget Safeguards:**
- ✅ No sensitive data in frontend code
- ✅ Error handling (try-catch blocks)
- ⚠️ Missing: Intent Preservation (no original intention logged)
- ⚠️ Missing: Scope Validation (no input sanitization)
- ⚠️ Missing: Human Approval Gates (no admin review for high-value tips)
- ⚠️ Missing: Audit Trail (no signature verification)

**Pillar 3 Score: 62/100** (well below 75 threshold)

---

### **Overall Convergence Status: NOT CONVERGED (yet)**

```
Intent Fidelity    : 78/100  ❌ FAIL (need ≥80)
Optimal Design     : 74/100  ❌ FAIL (need ≥80)
Code Consistency   : 62/100  ❌ FAIL (need ≥75)

Convergence Score  : 71.4/100
Outcome            : PARTIAL ⚠️
```

**Verdict:** Widget is **functionally complete** but **architecturally incomplete** for ORBIT 2.0. Must add:
1. Agent registration flow
2. KiloClaw Stage 1 validation (pre-tip)
3. Magnus safeguards (audit trail, intent preservation)
4. Error recovery (retry logic, graceful degradation)

---

## PART IX: INTEGRATION ROADMAP

### Phase 1: Agent Layer (Week 1)
- [ ] Add agent registration modal
- [ ] Store agentId + jwtToken in localStorage
- [ ] POST /orbit/agents/register backend endpoint
- [ ] Add KiloClaw Stage 1 validation

### Phase 2: Payment Integration (Week 2)
- [ ] Add agentId to tip requests
- [ ] Add authorization headers (JWT)
- [ ] Map EUR → Stripe, USDC → Circle
- [ ] Update database schema (agents_fan, payments tables)

### Phase 3: Behavior Tracking (Week 3)
- [ ] Log tips in agent_query_log
- [ ] Implement KiloClaw Stage 2 (async behavior analysis)
- [ ] Calculate fan_tier based on total_tips_amount_usd
- [ ] Display fan badges in chat

### Phase 4: Error Recovery & Hardening (Week 4)
- [ ] Add retry logic for failed polls
- [ ] Implement rate limiting (client-side + server-side)
- [ ] Add CSRF protection
- [ ] Encrypt localStorage data
- [ ] Add security headers

---

**ORBIT 2.0 Widget Validation is PARTIAL. Recommend proceeding to integration roadmap.** 🎨

