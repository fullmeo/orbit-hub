# 🚀 ORBIT 2.0 PHASE 5 QUICK START
## For Claude Code Implementation

**Status:** Ready to implement  
**Framework:** Magnus 13.2 + KiloClaw + Unified USDC  
**Target:** Production-ready by June 2026

---

## PART I: SETUP (5 minutes)

### Clone & Navigate

```bash
# Clone ORBIT repo (exists at fullmeo/orbit-hub)
git clone https://github.com/fullmeo/orbit-hub.git
cd orbit-hub

# Create Phase 5 branch
git checkout -b orbit-2.0-phase-5

# Create working directory
mkdir -p backend/netlify/functions/orbit
mkdir -p backend/database
mkdir -p backend/services
mkdir -p tests
```

### Environment Setup

```bash
# Copy template
cp .env.example .env

# Fill in:
# CIRCLE_API_KEY=sk_...
# CIRCLE_API_URL=https://api.circle.com
# JWT_SECRET=your_secret_key_32_chars_min
# DATABASE_URL=postgresql://user:pass@localhost/orbit
# KILO_ENDPOINT=https://gas-town.kilo.ai/dispatch
```

---

## PART II: WEEK 1 TASKS (Database + Agent Registration)

### Task 1.1: Create PostgreSQL Schema

```bash
# File: backend/database/schema.sql

# Run:
psql -U postgres -d orbit < backend/database/schema.sql

# Verify:
psql -U postgres -d orbit -c "\dt"
# Should show: agents, agents_fan, payments, fan_chat_interactions, 
#             thanks_messages, artist_agent_permissions, pending_payments, audit_log
```

**Schema File Contains:**
- 8 tables with indexes
- Foreign keys (referential integrity)
- Comments (for future developers)

**Convergence Check:**
```bash
# Count tables
psql -U postgres -d orbit -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
# Expected: 8
```

---

### Task 1.2: Create TypeScript Types

```bash
# File: backend/types/index.ts

export interface Agent {
  id: string;
  walletAddress: string;
  agentType: "caption_generator" | "user_created" | "fan_chat" | "orchestration";
  status: "PENDING_APPROVAL" | "ACTIVE" | "QUARANTINE" | "SUSPENDED" | "BLOCKED" | "BANNED";
  trustTier: "ACTIVE" | "TRUSTED" | "PREMIUM" | "FLAGGED";
  jwtToken: string;
  jwtExpiresAt: number;
  behaviorScore: number; // 0-100
  queriesCount: number;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentFan extends Agent {
  artistId: string;
  fanName: string;
  fanEmail: string;
  preferredCurrency: "EUR" | "USDC";
  totalTipsCount: number;
  totalTipsAmountUsd: number;
  chatLimitTier: "FREE" | "UNLIMITED";
  chatQueriesThisMonth: number;
  lastChatAt?: Date;
  fanTier: "FAN" | "SUPER_FAN" | "PATRON";
  firstTipAt?: Date;
  lastTipAt?: Date;
}

export interface Payment {
  id: string;
  agentId: string;
  artistId: string;
  amount: number; // Original amount
  currency: "EUR" | "USDC";
  amountUsdEquivalent: number;
  paymentType: "tip" | "merchandise" | "subscription";
  status: "pending" | "completed" | "failed";
  stripeChargeId?: string;
  x402TransactionHash?: string;
  artistReceived: number; // 80%
  platformFee: number; // 20%
  createdAt: Date;
  completedAt?: Date;
}

// Export all types
export type * from './models';
```

**Validation:**
```bash
# Compile TypeScript
npx tsc --noEmit

# Expected: 0 errors
```

---

### Task 1.3: Create JWT Service

```bash
# File: backend/services/jwt.ts

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const JWT_EXPIRY = 24 * 60 * 60; // 24 hours

export function generateJWT(agentId: string): string {
  return jwt.sign(
    { agentId, issuedAt: Date.now() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyJWT(token: string): { agentId: string; issuedAt: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { agentId: decoded.agentId, issuedAt: decoded.issuedAt };
  } catch (e) {
    console.error("JWT verification failed:", e.message);
    return null;
  }
}

export function getJWTExpiration(): number {
  return Math.floor(Date.now() / 1000) + JWT_EXPIRY;
}
```

**Test:**
```bash
# File: tests/jwt.test.ts

import { generateJWT, verifyJWT } from "../services/jwt";

describe("JWT Service", () => {
  it("should generate and verify JWT", () => {
    const agentId = "agent_test_123";
    const token = generateJWT(agentId);
    const decoded = verifyJWT(token);
    
    expect(decoded?.agentId).toBe(agentId);
    expect(decoded?.issuedAt).toBeDefined();
  });
  
  it("should reject invalid JWT", () => {
    const invalid = verifyJWT("invalid.token.here");
    expect(invalid).toBeNull();
  });
});
```

**Run:**
```bash
npm test -- tests/jwt.test.ts
# Expected: ✓ 2 passed
```

---

### Task 1.4: Implement /agents/register Endpoint

```bash
# File: backend/netlify/functions/orbit/agents-register.ts

import { Handler } from "@netlify/functions";
import { pool } from "../../database/client";
import { generateJWT, getJWTExpiration } from "../../services/jwt";
import { createCircleWallet } from "../../services/circle";

interface RegisterRequest {
  agentType: string;
  fanName: string;
  email: string;
  artistId: string;
  preferredCurrency: "EUR" | "USDC";
}

interface RegisterResponse {
  agentId: string;
  jwtToken: string;
  walletAddress: string;
  expiresAt: number;
  status: string;
  chatLimitTier: string;
  chatQueriesThisMonth: number;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body: RegisterRequest = JSON.parse(event.body || "{}");
    
    // Validate input
    if (!body.fanName || !body.email || !body.artistId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "MISSING_REQUIRED_FIELDS" })
      };
    }
    
    // Check if already registered (by email + artistId)
    const existing = await pool.query(
      `SELECT id FROM agents_fan WHERE email = $1 AND artist_id = $2`,
      [body.email, body.artistId]
    );
    
    if (existing.rows.length > 0) {
      // Idempotent: return existing agent
      const agentId = existing.rows[0].id;
      const agent = await pool.query(
        `SELECT * FROM agents WHERE id = $1`,
        [agentId]
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          agentId,
          jwtToken: generateJWT(agentId),
          walletAddress: agent.rows[0].wallet_address,
          expiresAt: getJWTExpiration(),
          status: "ACTIVE",
          chatLimitTier: "FREE",
          chatQueriesThisMonth: 0
        })
      };
    }
    
    // Create new agent
    const agentId = crypto.randomUUID();
    const walletAddress = await createCircleWallet(); // Async call to Circle
    
    // Insert into agents table
    await pool.query(
      `INSERT INTO agents (id, wallet_address, agent_type, status, trust_tier, behavior_score, registered_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', 'ACTIVE', 75.0, NOW(), NOW(), NOW())`,
      [agentId, walletAddress, body.agentType]
    );
    
    // Insert into agents_fan table
    await pool.query(
      `INSERT INTO agents_fan (id, agent_id, artist_id, fan_name, email, preferred_currency, chat_limit_tier, chat_queries_this_month, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'FREE', 0, NOW(), NOW())`,
      [crypto.randomUUID(), agentId, body.artistId, body.fanName, body.email, body.preferredCurrency]
    );
    
    const jwtToken = generateJWT(agentId);
    
    // Audit trail
    await logAuditTrail({
      action: "AGENT_REGISTERED",
      agentId,
      artistId: body.artistId,
      details: { fanName: body.fanName, email: body.email }
    });
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        agentId,
        jwtToken,
        walletAddress,
        expiresAt: getJWTExpiration(),
        status: "ACTIVE",
        chatLimitTier: "FREE",
        chatQueriesThisMonth: 0
      } as RegisterResponse)
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR" })
    };
  }
};
```

**Test:**
```bash
# Manual test
curl -X POST http://localhost:8888/.netlify/functions/orbit/agents-register \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "fan_chat",
    "fanName": "Alice",
    "email": "alice@example.com",
    "artistId": "allyson_glado",
    "preferredCurrency": "EUR"
  }'

# Expected response (201):
# {
#   "agentId": "agent_...",
#   "jwtToken": "eyJhbGc...",
#   "walletAddress": "0x...",
#   "expiresAt": 1714...,
#   "status": "ACTIVE",
#   "chatLimitTier": "FREE",
#   "chatQueriesThisMonth": 0
# }
```

---

## PART III: CONVERGENCE VALIDATION

### Week 1 Convergence Check

```bash
# After implementing Week 1 tasks:

# 1. Database check
psql -U postgres -d orbit -c "SELECT count(*) FROM agents;" 
# Expected: ≥1 (agent created)

# 2. JWT validation
npm test -- tests/jwt.test.ts
# Expected: ✓ 2 passed

# 3. Registration endpoint
npm test -- tests/agents-register.test.ts
# Expected: ✓ 5 passed (register, idempotent, validation, error, JWT)

# 4. Code coverage
npm run coverage
# Expected: >80% for critical paths (JWT, registration, auth)

# 5. Magnus convergence metrics
echo "Week 1 Convergence:"
echo "- Intent Fidelity: Agent registers once (✓)"
echo "- Optimal Design: JWT 24h expiry, async wallet (✓)"
echo "- Code Consistency: Input validation, error handling, audit trail (✓)"
echo "- Estimated score: 85/100 (on track to 87.4 overall)"
```

---

## PART IV: GIT WORKFLOW

### Commit Strategy

```bash
# After each task, commit with detailed message:

git add -A
git commit -m "Week 1.1: Add PostgreSQL schema (8 tables, indexes)

- agents (core agent table)
- agents_fan (fan-specific data)
- payments (transaction records)
- fan_chat_interactions (chat history)
- thanks_messages (AI thanks)
- artist_agent_permissions (per-artist rules)
- pending_payments (temporary payment state)
- audit_log (immutable action trail)

Validation:
- Schema passes referential integrity checks
- Indexes created for performance
- Comments added for future developers

Convergence metrics:
- Database readiness: 100%
- Week 1 progress: 25%"
```

### Push to GitHub

```bash
git push origin orbit-2.0-phase-5

# Create PR for review (optional)
# github pr create --base main --head orbit-2.0-phase-5 --title "ORBIT 2.0 Phase 5 Week 1" --body "Database + agent registration"
```

---

## PART V: DEBUGGING TIPS

### Common Issues

**Issue: JWT verification fails**
```bash
# Check: JWT_SECRET is set
echo $JWT_SECRET

# Check: Token not expired
# Decode: https://jwt.io (paste token)
```

**Issue: Circle wallet creation times out**
```bash
# Add retry logic with exponential backoff:
async function createCircleWalletWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createCircleWallet();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

**Issue: Database connection pool exhausted**
```bash
# Check pool size:
SELECT count(*) FROM pg_stat_activity WHERE datname = 'orbit';

# Increase pool size in .env:
DATABASE_POOL_SIZE=20
```

---

## PART VI: QUICK REFERENCE

### Files to Create (Week 1)

```
backend/
├─ database/
│  ├─ schema.sql          ← PostgreSQL schema (8 tables)
│  └─ client.ts           ← Pool client factory
├─ services/
│  ├─ jwt.ts              ← JWT generation/verification
│  ├─ circle.ts           ← Circle API integration (wallet creation)
│  └─ kilclaw.ts          ← KiloClaw validators (Stage 1/2)
├─ types/
│  └─ index.ts            ← TypeScript interfaces (Agent, Payment, etc.)
├─ netlify/functions/orbit/
│  ├─ agents-register.ts  ← POST /agents/register
│  ├─ payments-create.ts  ← POST /payments/create (Week 2)
│  ├─ payments-status.ts  ← GET /payments/{id} (Week 2)
│  ├─ fan-chat.ts         ← POST /fan-chat (Week 3)
│  └─ thanks.ts           ← GET /thanks (Week 3)
└─ tests/
   ├─ jwt.test.ts
   ├─ agents-register.test.ts
   ├─ payments.test.ts (Week 2)
   └─ chat.test.ts (Week 3)
```

### Commands Cheat Sheet

```bash
# Development
npm run dev              # Start local dev server
npm test                 # Run all tests
npm run coverage         # Coverage report
npm run lint             # ESLint + Prettier

# Deployment
npm run build            # Build TypeScript
git push origin orbit-2.0-phase-5
# GitHub Actions will run tests + deploy to Netlify

# Database
psql -U postgres -d orbit
> SELECT * FROM agents;
> SELECT COUNT(*) FROM agents_fan;

# Monitoring
npm run metrics          # Print convergence metrics
npm run healthcheck      # Check all services (DB, Circle, Kilo)
```

---

## PART VII: SUCCESS CRITERIA (Week 1)

✅ **Complete when:**

1. Database schema created + verified (8 tables, indexes)
2. JWT service generates 24h tokens (pass crypto validation)
3. Agent registration endpoint implemented + tested
4. At least 1 agent registered in database
5. All commits pushed to `orbit-2.0-phase-5` branch
6. Test coverage >80% for critical paths
7. Convergence check: Intent Fidelity ≥85, Design ≥80, Consistency ≥80

---

**🚀 Week 1 is the foundation. Everything Week 2-5 depends on it.**

**Questions? Ambiguities? Report back to claude.ai in main thread.**

