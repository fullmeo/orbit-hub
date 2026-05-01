# 📊 ORBIT 2.0 WEEK 2 CONVERGENCE BASELINE
## Payment System (May 6-10, 2026)

**Status:** Ready to execute  
**Entry Point:** WEEK_2_TASKS.md  
**Target Convergence:** 87.3/100 (Intent 90, Design 87, Consistency 84)  
**Report Due:** Friday May 10, 5:00 PM UTC

---

## PART I: STARTING STATE (Monday Morning)

### What You Have (From Week 1)

```
✅ WEEK 1 COMPLETE:
├─ Database: 8 tables (agents, payments, audit_log, etc.)
├─ JWT Service: 24h tokens, working perfectly
├─ Agent Registration: POST /agents/register functional
├─ Widget Modal: Registration working, localStorage persisting
├─ Tests: 72 passing, 80.32% coverage
└─ Convergence: 88/100 (EXCEEDED target)

✅ PRODUCTION CODE (Circle Integration):
├─ circle-tips.js (payment creation)
├─ circle-webhook.js (webhook handling)
├─ Payment flow: Working end-to-end
└─ Claude AI thanks: Generating personalized messages

⚠️ GAPS TO FIX (Week 2):
├─ No KiloClaw Stage 1 validation (pre-payment checks)
├─ No EUR→USDC conversion logic
├─ No persistent payment records (agent_query_log)
├─ No daily tip limit enforcement
└─ No behavior score updates after payment
```

**Starting Convergence:** 80.2/100 (Payments exist but not in agent system)

---

## PART II: WEEK 2 SUCCESS CRITERIA (Must Be ✅ Friday EOD)

### Task 2.1: Payment Creation Endpoint (Day 1-2)

**Must Create:**
```javascript
✅ POST /orbit/payments/create
├─ Input: {
│    agentId,        // From JWT
│    artistId,
│    amount: 5,      // EUR or USDC
│    currency: "EUR" // or "USDC"
│  }
├─ Output: {
│    paymentId,
│    walletAddress,
│    amountUSDC: 5.5,        // Converted
│    originalCurrency: "EUR",
│    originalAmount: 5,
│    expiresAt: timestamp,
│    status: "PENDING"
│  }
└─ Side Effects:
   ├─ KiloClaw Stage 1 validation (pre-payment)
   ├─ Create Circle PaymentIntent
   ├─ Record in pending_payments table
   ├─ Log in audit_log
   └─ Return wallet address to client
```

**Validation (Pre-Payment):**
```typescript
✅ KiloClaw Stage 1 Checks (all must pass):

1. JWT Validity
   ├─ Token not expired
   ├─ Signature valid
   └─ agentId matches JWT.agentId

2. Agent Status
   ├─ Agent exists in DB
   ├─ Status = "ACTIVE" (not BLOCKED, SUSPENDED, etc.)
   └─ behavior_score >= 30 (minimum reputation)

3. Artist Permissions
   ├─ Artist hasn't blocked this agent
   ├─ Agent access_level = "PUBLIC" or higher
   └─ Daily tip limit not exceeded (default: 10/day)

4. Rate Limiting
   ├─ Agent hasn't tipped >10 times today to this artist
   ├─ Agent hasn't tipped >50 times today (global)
   └─ No duplicate tips (same amount within 60s)

5. Amount Validation
   ├─ Amount > 0 (must be positive)
   ├─ Amount <= 1000 (max single tip)
   ├─ Currency in ["EUR", "USDC"]
   └─ artistId exists in system

Response Codes:
├─ 201: Payment intent created (approved)
├─ 400: Invalid input (missing fields, bad format)
├─ 401: JWT invalid or expired
├─ 403: Agent blocked, status inactive, daily limit exceeded, low reputation
├─ 429: Rate limit exceeded
└─ 500: Server error (logged)
```

**Verification:**
```bash
# Test 1: Valid EUR tip
curl -X POST http://localhost:8888/.netlify/functions/orbit/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat .jwt_token)" \
  -d '{
    "agentId": "agent_...",
    "artistId": "allyson_glado",
    "amount": 5,
    "currency": "EUR"
  }'
# Expected: 201
# {
#   "paymentId": "payment_...",
#   "walletAddress": "0x...",
#   "amountUSDC": 5.5,
#   "status": "PENDING"
# }

# Test 2: USDC tip
curl -X POST ... -d '{"amount": 10, "currency": "USDC"}'
# Expected: 201, amountUSDC: 10

# Test 3: Daily limit exceeded
curl -X POST ... (11th tip in one day)
# Expected: 403, reason: "DAILY_LIMIT_EXCEEDED"

# Test 4: Expired JWT
curl -X POST ... -H "Authorization: Bearer expired_token"
# Expected: 401, reason: "JWT_EXPIRED"

npm test -- tests/payments-create.test.ts
# Expected: ✓ 15+ passed
```

---

### Task 2.2: EUR→USDC Conversion (Day 2)

**Must Implement:**
```typescript
✅ export async function convertEURtoUSDC(amount: number): Promise<number> {
  // Get live exchange rate from Circle
  const rate = await getCircleExchangeRate("EUR", "USDC");
  // Typically: 1 EUR = ~1.1 USDC
  return amount * rate;
}

✅ export function getCircleExchangeRate(from: string, to: string): Promise<number> {
  // Call Circle API to get live rate
  // Cache for 1 hour (don't call on every request)
  const cachedRate = getFromCache(`rate_${from}_${to}`);
  if (cachedRate && !isExpired(cachedRate)) {
    return cachedRate.rate;
  }
  
  const response = await fetch("https://api.circle.com/v1/configuration/payment/fiat-currency-pairs", {
    headers: { "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}` }
  });
  const data = await response.json();
  const rate = data.pairs.find(p => p.from === from && p.to === to).rate;
  
  setCache(`rate_${from}_${to}`, rate, 3600); // Cache 1 hour
  return rate;
}
```

**Verification:**
```bash
# Test conversion logic
npm test -- tests/conversion.test.ts
# Expected: ✓ 8+ passed
# - 5 EUR = 5.5 USDC
# - 10 EUR = 11 USDC
# - Rate caching works
# - API failure handled gracefully
```

---

### Task 2.3: KiloClaw Stage 1 Validator (Day 2-3)

**Must Implement:**
```typescript
✅ export async function kiloClawStage1Validate(
  agentId: string,
  jwtToken: string,
  artistId: string,
  amount: number
): Promise<ValidationResult> {
  
  const intention = "Validate agent + permissions before creating payment";
  logIntent(intention);
  
  // CHECK 1: JWT Validity
  const decoded = verifyJWT(jwtToken);
  if (!decoded || decoded.agentId !== agentId) {
    logSecurityEvent({ type: "JWT_MISMATCH", agentId });
    return { approved: false, reason: "JWT_INVALID", code: 401 };
  }
  
  // CHECK 2: Agent Active
  const agent = await db.agents.findById(agentId);
  if (!agent || agent.status !== "ACTIVE") {
    return { approved: false, reason: "AGENT_NOT_ACTIVE", code: 403 };
  }
  
  // CHECK 3: Reputation Threshold
  if (agent.behavior_score < 30) {
    logForManualReview({
      type: "LOW_REPUTATION_TIP",
      agentId,
      behaviorScore: agent.behavior_score
    });
    return { approved: false, reason: "MANUAL_REVIEW_REQUIRED", code: 403 };
  }
  
  // CHECK 4: Artist Permissions
  const permission = await db.artist_agent_permissions.findOne({
    artist_id: artistId,
    agent_id: agentId
  });
  if (permission && !permission.can_access) {
    return { approved: false, reason: "ARTIST_BLOCKED_AGENT", code: 403 };
  }
  
  // CHECK 5: Daily Limit (per artist)
  const tipsToday = await db.payments.countByDay(agentId, artistId);
  const dailyLimit = permission?.daily_query_limit ?? 10;
  if (tipsToday >= dailyLimit) {
    return { 
      approved: false, 
      reason: "DAILY_LIMIT_EXCEEDED", 
      code: 429,
      retryAfter: 86400
    };
  }
  
  // CHECK 6: Global Rate Limit
  const tipsGlobalToday = await db.payments.countGlobalByDay(agentId);
  if (tipsGlobalToday >= 50) {
    return { approved: false, reason: "GLOBAL_LIMIT_EXCEEDED", code: 429 };
  }
  
  // CHECK 7: Duplicate Check (same amount within 60s)
  const lastTip = await db.payments.findLastByAgent(agentId, artistId);
  if (lastTip && 
      lastTip.amount === amount && 
      (Date.now() - lastTip.created_at) < 60000) {
    return { approved: false, reason: "DUPLICATE_TIP", code: 429 };
  }
  
  // AUDIT TRAIL
  logAuditTrail({
    action: "KILCLAW_STAGE1_APPROVED",
    agentId,
    artistId,
    amount,
    timestamp: Date.now(),
    signature: hash({agentId, artistId, amount})
  });
  
  return { approved: true, reason: "APPROVED", code: 201 };
}
```

**Verification:**
```bash
npm test -- tests/kilclaw-stage1.test.ts
# Expected: ✓ 12+ passed
# - Valid agent approved
# - Expired JWT rejected
# - Low reputation flagged
# - Daily limit enforced
# - Global limit enforced
# - Duplicates detected
# - Artist blocks respected
```

---

### Task 2.4: Circle Webhook Integration (Day 3-4)

**Already Exists (circle-webhook.js):**
```javascript
✅ POST /.netlify/functions/circle-webhook
├─ Receives: Circle payment settlement confirmation
├─ Extracts: transactionHash, status, amount
├─ Updates: pending_payments → payments (mark "completed")
├─ Records: agent_query_log (for behavior analysis)
├─ Triggers: Thank you message generation
└─ Side Effects:
   ├─ Update agents_fan.total_tips_count
   ├─ Update agents_fan.total_tips_amount_usd
   ├─ Check for tier upgrade (if >= €5)
   └─ Queue KiloClaw Stage 2 async job
```

**Must Verify:**
```bash
npm test -- tests/circle-webhook.test.ts
# Expected: ✓ 18+ passed (from Week 1)
# - Webhook payload parsed correctly
# - Thank you message generated
# - Payment marked as completed
# - Agent stats updated
# - Tier upgrade triggered
```

---

### Task 2.5: Payment Status Polling (Day 4)

**Must Create:**
```javascript
✅ GET /orbit/payments/:paymentId
├─ Query: ?agentId={agentId}
├─ Header: Authorization: Bearer {jwtToken}
├─ Returns: {
│    paymentId,
│    status: "pending" | "completed" | "failed",
│    walletAddress,
│    amountUSDC,
│    transactionHash (if completed),
│    artistReceived,
│    platformFee,
│    completedAt
│  }
└─ Logic:
   ├─ Verify JWT + agentId match
   ├─ Check Circle for settlement status
   ├─ Update DB if status changed
   ├─ If completed: mark as "completed", run Stage 2
   └─ If timeout (>1hr): mark as "failed"

Response Codes:
├─ 200: Payment found + status returned
├─ 401: JWT invalid
├─ 403: agentId doesn't match
├─ 404: Payment not found
└─ 500: Server error
```

**Verification:**
```bash
# Simulate payment flow
# 1. Create payment
PAYMENT_ID=$(curl -X POST /payments/create | jq -r '.paymentId')

# 2. Poll status (should be PENDING)
curl -X GET /payments/$PAYMENT_ID?agentId=$AGENT_ID \
  -H "Authorization: Bearer $JWT"
# Expected: { "status": "pending" }

# 3. After Circle settles (webhook called)
curl -X GET /payments/$PAYMENT_ID?agentId=$AGENT_ID
# Expected: { "status": "completed", "transactionHash": "0x..." }

npm test -- tests/payments-status.test.ts
# Expected: ✓ 8+ passed
```

---

### Task 2.6: Agent Query Logging (Day 5)

**Must Implement:**
```typescript
✅ After payment completed, insert into agent_query_log:

INSERT INTO agent_query_log (
  id,
  agent_id,
  artist_id,
  query_type,     // "tip"
  cost_usdc,
  artist_received_usdc,
  platform_fee_usdc,
  x402_transaction_hash,
  query_timestamp,
  response_time_ms,
  status,
  created_at
) VALUES (...)

✅ This enables:
├─ Behavior scoring (Kilo analysis)
├─ Revenue tracking
├─ Artist reconciliation
├─ Fraud detection patterns
└─ Future machine learning
```

**Verification:**
```bash
psql -U postgres -d orbit << EOF
SELECT * FROM agent_query_log 
WHERE agent_id = 'agent_...' 
ORDER BY created_at DESC 
LIMIT 5;
EOF
# Expected: 5 recent tip records with all fields populated
```

---

### Testing (All Week)

**Must Have:**
```bash
✅ Unit Tests (80%+ coverage)
├─ tests/payments-create.test.ts (15 tests)
├─ tests/conversion.test.ts (8 tests)
├─ tests/kilclaw-stage1.test.ts (12 tests)
├─ tests/payments-status.test.ts (8 tests)
└─ tests/agent-query-log.test.ts (7 tests)

✅ Total: 50+ new test cases

✅ Coverage Report:
npm run coverage
# Expected: >85% (up from 80%)
# payments/create.ts: 90%+
# kilclaw-stage1.ts: 95%+
# conversion.ts: 100%
```

**Verification:**
```bash
npm test
# Expected: ✓ 122+ total (72 from Week 1 + 50 new)
# Expected: Overall coverage >85%

npm run coverage
# Expected output:
# Statements: 94%+
# Branches: 85%+ (up from 80.32%)
# Functions: 94%+
# Lines: 95%+
```

---

## PART III: DAILY CHECKLIST

### Monday (May 6)
- [ ] Review WEEK_2_TASKS.md
- [ ] Start Task 2.1: Payment creation endpoint
- [ ] Study KiloClaw validation logic
- [ ] Daily: `npm test && npm run coverage`

### Tuesday (May 7)
- [ ] Finish Task 2.1: POST /payments/create working
- [ ] Start Task 2.2: EUR→USDC conversion
- [ ] 15+ tests passing for payments
- [ ] Daily: `npm test && npm run coverage`

### Wednesday (May 8)
- [ ] Finish Task 2.2: Conversion with caching
- [ ] Start Task 2.3: KiloClaw Stage 1 validator
- [ ] Mid-week check: Are we on pace? (should be 50% done)
- [ ] Daily: `npm test && npm run coverage`

### Thursday (May 9)
- [ ] Finish Task 2.3: KiloClaw Stage 1 tests passing
- [ ] Start Task 2.4: Verify Circle webhook
- [ ] Start Task 2.5: Payment status polling
- [ ] Daily: `npm test && npm run coverage`

### Friday (May 10)
- [ ] Finish Task 2.5: Status polling working
- [ ] Finish Task 2.6: Agent query logging
- [ ] Run all tests: `npm test` (expect 122+ passing)
- [ ] Generate coverage: `npm run coverage` (expect >85%)
- [ ] Commit to GitHub: `git push origin orbit-2.0-phase-5`
- [ ] **Fill out PHASE_5_WEEK2_REPORT.md** (see below)
- [ ] Report convergence scores to claude.ai thread

---

## PART IV: FRIDAY EOD REPORT TEMPLATE

**Save as `PHASE_5_WEEK2_REPORT.md` and fill out Friday:**

```markdown
# 📊 ORBIT 2.0 WEEK 2 CONVERGENCE REPORT
**Date:** Friday May 10, 2026 5:00 PM UTC  
**Status:** [✅ CONVERGED / ⚠️ PARTIAL / ❌ FAILED]

## DELIVERABLES

### Payment Creation Endpoint (Task 2.1)
- [x] POST /orbit/payments/create working
- [x] KiloClaw Stage 1 validation integrated
- [x] Circle PaymentIntent created
- [x] pending_payments record inserted
- [x] 15+ tests passing

**Evidence:**
```bash
curl -X POST /payments/create -H "Authorization: Bearer $JWT" \
  -d '{"agentId":"...", "amount": 5, "currency": "EUR"}'
# 201: { "paymentId": "payment_...", "amountUSDC": 5.5 }
```

### EUR→USDC Conversion (Task 2.2)
- [x] Live exchange rate fetching
- [x] Rate caching (1 hour TTL)
- [x] Accurate conversion (5 EUR → 5.5 USDC)
- [x] 8+ tests passing

**Evidence:**
```bash
npm test -- tests/conversion.test.ts
# ✓ 8 passed (conversion accuracy, caching, API failure)
```

### KiloClaw Stage 1 Validator (Task 2.3)
- [x] JWT validation
- [x] Agent status check
- [x] Reputation threshold (behavior_score >= 30)
- [x] Artist permission enforcement
- [x] Daily limit enforcement (10/day per artist)
- [x] Global rate limiting (50/day total)
- [x] Duplicate detection (same amount within 60s)
- [x] 12+ tests passing

**Evidence:**
```bash
npm test -- tests/kilclaw-stage1.test.ts
# ✓ 12 passed (all validation checks)
```

### Circle Webhook Integration (Task 2.4)
- [x] Webhook payload processing
- [x] Payment marked as "completed"
- [x] Transaction hash recorded
- [x] 18+ tests passing (from Week 1)

**Evidence:**
```bash
npm test -- tests/circle-webhook.test.ts
# ✓ 18 passed (webhook processing)
```

### Payment Status Polling (Task 2.5)
- [x] GET /payments/:paymentId endpoint
- [x] Status checking (pending/completed/failed)
- [x] DB updates on settlement
- [x] 8+ tests passing

**Evidence:**
```bash
curl -X GET /payments/$PAYMENT_ID?agentId=$AGENT_ID \
  -H "Authorization: Bearer $JWT"
# 200: { "status": "completed", "transactionHash": "0x..." }
```

### Agent Query Logging (Task 2.6)
- [x] Records inserted into agent_query_log
- [x] Behavior score updates enabled
- [x] Revenue tracking working
- [x] 7+ tests passing

**Evidence:**
```bash
psql -d orbit -c "SELECT COUNT(*) FROM agent_query_log WHERE query_type='tip';"
# 5+ tip records found
```

### Testing & Coverage
- [x] 50+ new tests passing (payments-related)
- [x] Total: 122+ tests (72 Week 1 + 50 Week 2)
- [x] Coverage >85% (up from 80.32%)
- [x] 0 failures, 0 flakes

**Evidence:**
```bash
npm test
# ✓ 122 passed (~8s total)

npm run coverage
# Statements: 94%+
# Branches: 85%+ ✓
# Functions: 94%+
# Lines: 95%+
```

## CONVERGENCE SCORES

### Intent Fidelity: 90/100 ✅
- Payment creation fully integrated
- EUR→USDC conversion working
- KiloClaw Stage 1 enforcing rules
- Agent query logging enabled

### Optimal Design: 87/100 ✅
- Clean endpoint structure
- Rate limiting implemented
- Error handling comprehensive
- Validation logic modular

### Code Consistency: 84/100 ✅
- Intent preservation: ✓
- Scope validation: ✓
- Safety checks: ✓
- Audit trail: ✓
- Minor: -16 (could add monitoring for Circle API latency)

## FINAL SCORE: 87.3/100 ✅ CONVERGED

---

## BLOCKERS (If Any)
- [None / List any issues encountered]

## NEXT WEEK (Week 3)
- Chat system integration
- Premium chat tier logic (5 free/month)
- KiloClaw Stage 2 async behavior analysis
- Target convergence: 88.0/100

## SIGN-OFF
- [ ] All tests passing (122+)
- [ ] Coverage >85%
- [ ] Code committed to GitHub
- [ ] Convergence score: 87.3/100
- [ ] Ready for Week 3

**Signed:** [Your name]  
**Date:** May 10, 2026
```

---

## PART V: CONVERGENCE RUBRIC (Scoring Guide)

### Intent Fidelity — Out of 100

```
90-95: Payment system fully integrated
├─ ✅ Creation endpoint working
├─ ✅ EUR→USDC conversion accurate
├─ ✅ KiloClaw validation enforced
└─ ✅ Query logging enabled

80-89: Payment system mostly working
├─ Works, but [minor gap]
└─ Deduction: -10 to -20 points

<80: Payment system incomplete
└─ Missing validation or logging
```

### Optimal Design — Out of 100

```
85-92: Clean, modular, maintainable
├─ ✅ Conversion logic cached
├─ ✅ Validation checks separated
├─ ✅ Error messages helpful
└─ ✅ Tests document behavior

75-84: Good, but could be better
├─ Works well, but [design gap]
└─ Deduction: -8 to -15 points
```

### Code Consistency — Out of 100

```
85-100: All 7 safeguards applied
├─ ✅ Intent Preservation (all logs include intention)
├─ ✅ Scope Validation (input checks)
├─ ✅ Safety Checks (no hardcoded secrets)
├─ ✅ Bias Detection (consistent behavior)
├─ ✅ Human Approval Gates (low-score flagging)
├─ ✅ Rollback (audit trail enables recovery)
└─ ✅ Audit Trail (all actions logged)

75-84: Most safeguards applied (1-2 missing)
└─ Deduction: -15 to -25 points
```

---

## FINAL CHECKLIST (Friday EOD)

```
✅ PAYMENT CREATION
  [ ] POST /payments/create working
  [ ] KiloClaw Stage 1 validation integrated
  [ ] Circle PaymentIntent created
  [ ] pending_payments table updated
  [ ] 15+ tests passing

✅ CONVERSION
  [ ] EUR→USDC logic working
  [ ] Live rates fetched
  [ ] Caching implemented
  [ ] 8+ tests passing

✅ KILCLAW STAGE 1
  [ ] JWT validation
  [ ] Agent status check
  [ ] Reputation threshold
  [ ] Permission enforcement
  [ ] Daily limit enforcement
  [ ] Global rate limiting
  [ ] Duplicate detection
  [ ] 12+ tests passing

✅ WEBHOOKS & POLLING
  [ ] Circle webhook processing (verified from Week 1)
  [ ] Payment status polling working
  [ ] Agent query logging working
  [ ] 33+ tests passing total

✅ OVERALL
  [ ] 122+ total tests passing (72 + 50 new)
  [ ] Coverage >85%
  [ ] All commits pushed
  [ ] REPORT.md filed
  [ ] Convergence score: 87.3/100

SIGN-OFF: [ ] Ready for Week 3
```

---

**🎯 Week 2 Success = Everything above is ✅ by Friday EOD.**

**Report back to claude.ai thread Friday with convergence scores and blockers (if any).**

**Next week: Chat System + Premium Tiers.** 🚀

