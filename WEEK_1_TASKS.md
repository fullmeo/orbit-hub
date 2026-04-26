# ⚡ Week 1 Tasks - Quick Reference

**Duration:** Mon 2026-04-29 → Fri 2026-05-03  
**Target:** All 4 tasks COMPLETED  
**Report Due:** Friday EOD (use PHASE_5_WEEK1_REPORT.md)

---

## 🎯 Task Breakdown

### Task 1.1: PostgreSQL Schema
**Difficulty:** ⭐⭐☆ (Easy-Medium)  
**Time:** 30 mins  
**Status:** `[ ] TODO` `[ ] IN PROGRESS` `[ ] DONE`

```bash
# 1. Create file:
mkdir -p backend/database
# Edit: backend/database/schema.sql

# 2. Add these 8 tables:
CREATE TABLE agents (...)
CREATE TABLE agents_fan (...)
CREATE TABLE payments (...)
CREATE TABLE fan_chat_interactions (...)
CREATE TABLE thanks_messages (...)
CREATE TABLE artist_agent_permissions (...)
CREATE TABLE pending_payments (...)
CREATE TABLE audit_log (...)

# 3. Run it:
psql -U postgres -d orbit < backend/database/schema.sql

# 4. Verify:
psql -U postgres -d orbit -c "\dt"
# Output should show 8 tables
```

**Details:** See PHASE_5_QUICK_START.md Part II, Task 1.1

---

### Task 1.2: TypeScript Types
**Difficulty:** ⭐☆☆ (Easy)  
**Time:** 20 mins  
**Status:** `[ ] TODO` `[ ] IN PROGRESS` `[ ] DONE`

```bash
# 1. Create file:
mkdir -p backend/types
# Edit: backend/types/index.ts

# 2. Add interfaces:
interface Agent { ... }
interface AgentFan extends Agent { ... }
interface Payment { ... }

# 3. Compile check:
npx tsc --noEmit
# Should show: 0 errors
```

**Details:** See PHASE_5_QUICK_START.md Part II, Task 1.2

---

### Task 1.3: JWT Service
**Difficulty:** ⭐⭐☆ (Easy-Medium)  
**Time:** 30 mins  
**Status:** `[ ] TODO` `[ ] IN PROGRESS` `[ ] DONE`

```bash
# 1. Create file:
mkdir -p backend/services
# Edit: backend/services/jwt.ts

# 2. Implement:
export function generateJWT(agentId: string): string { ... }
export function verifyJWT(token: string) { ... }
export function getJWTExpiration(): number { ... }

# 3. Test it:
mkdir -p tests
# Edit: tests/jwt.test.ts
npm test -- tests/jwt.test.ts
# Should show: ✓ 2 passed
```

**Details:** See PHASE_5_QUICK_START.md Part II, Task 1.3

---

### Task 1.4: Agent Registration Endpoint
**Difficulty:** ⭐⭐⭐ (Medium)  
**Time:** 60 mins  
**Status:** `[ ] TODO` `[ ] IN PROGRESS` `[ ] DONE`

```bash
# 1. Create file:
mkdir -p backend/netlify/functions/orbit
# Edit: backend/netlify/functions/orbit/agents-register.ts

# 2. Implement:
export const handler: Handler = async (event) => {
  // Validate input
  // Check if already registered
  // Create new agent
  // Generate JWT
  // Log audit trail
  // Return response
}

# 3. Test endpoint (local):
npm run dev  # Start Netlify local dev
curl -X POST http://localhost:8888/.netlify/functions/orbit/agents-register \
  -H "Content-Type: application/json" \
  -d '{"agentType":"fan_chat","fanName":"Alice","email":"alice@example.com","artistId":"allyson_glado","preferredCurrency":"EUR"}'

# Should return 201 with agentId, jwtToken, walletAddress

# 4. Run integration tests:
npm test -- tests/agents-register.test.ts
# Should show: ✓ 5 passed
```

**Details:** See PHASE_5_QUICK_START.md Part II, Task 1.4

---

## ✅ Daily Checklist

### Monday 2026-04-29
- [ ] Clone repo: `git clone https://github.com/fullmeo/orbit-hub.git`
- [ ] Create branch: `git checkout -b orbit-2.0-phase-5`
- [ ] Read PHASE_5_QUICK_START.md (30 mins)
- [ ] Start Task 1.1 (PostgreSQL schema)
- [ ] Commit: `git commit -m "Week 1.1: Add PostgreSQL schema"`

### Tuesday 2026-04-30
- [ ] Complete Task 1.1 (schema verification)
- [ ] Start Task 1.2 (TypeScript types)
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Commit: `git commit -m "Week 1.2: Add TypeScript types"`

### Wednesday 2026-05-01
- [ ] Complete Task 1.2 (types)
- [ ] Start Task 1.3 (JWT service)
- [ ] Write unit tests for JWT
- [ ] Run tests: `npm test -- tests/jwt.test.ts`
- [ ] Commit: `git commit -m "Week 1.3: Implement JWT service + tests"`

### Thursday 2026-05-02
- [ ] Complete Task 1.3 (JWT)
- [ ] Start Task 1.4 (registration endpoint)
- [ ] Implement registration logic
- [ ] Write integration tests
- [ ] Debug any issues

### Friday 2026-05-03
- [ ] Complete Task 1.4 (registration endpoint)
- [ ] Run full test suite: `npm test`
- [ ] Check coverage: `npm run coverage`
- [ ] Push to GitHub: `git push origin orbit-2.0-phase-5`
- [ ] **Fill out PHASE_5_WEEK1_REPORT.md**
- [ ] Submit report

---

## 📊 Progress Tracking

### File Checklist
```
backend/
├─ database/schema.sql           [ ] TODO
├─ types/index.ts                [ ] TODO
├─ services/jwt.ts               [ ] TODO
├─ netlify/functions/orbit/agents-register.ts [ ] TODO
└─ tests/
   ├─ jwt.test.ts                [ ] TODO
   └─ agents-register.test.ts     [ ] TODO
```

### Commit Checklist
```bash
git log --oneline
# Monday:    [ ] Week 1.1: Add PostgreSQL schema
# Tuesday:   [ ] Week 1.2: Add TypeScript types
# Wednesday: [ ] Week 1.3: Implement JWT service + tests
# Thursday:  [ ] [Task 1.4 commits]
# Friday:    [ ] Week 1 complete + report filed
```

---

## 🚀 Testing Commands

```bash
# Quick test (all)
npm test

# Specific tests
npm test -- tests/jwt.test.ts
npm test -- tests/agents-register.test.ts

# Coverage report
npm run coverage

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Database check
psql -U postgres -d orbit -c "SELECT COUNT(*) FROM agents;"

# Count tables
psql -U postgres -d orbit -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
```

---

## 🔑 Key Variables

### Environment (.env)
```
DATABASE_URL=postgresql://user:password@localhost/orbit
JWT_SECRET=your_32_char_secret_key_here
CIRCLE_API_KEY=sk_test_...
```

### Database Connection (backend/database/client.ts)
```typescript
import { Pool } from 'pg';
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

---

## 💡 Debugging Tips

### "psql: command not found"
```bash
# Install PostgreSQL (if needed)
brew install postgresql  # macOS
# or via Docker:
docker run -d -p 5432:5432 postgres:latest
```

### "JWT test fails"
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET
# Should output your secret key

# If not set:
export JWT_SECRET="your_32_char_secret_key_12345"
```

### "Table doesn't exist"
```bash
# Check schema was loaded
psql -U postgres -d orbit -c "\dt"
# Should show 8 tables

# If not, re-run schema:
psql -U postgres -d orbit < backend/database/schema.sql
```

### "Test can't connect to database"
```bash
# Verify postgres is running
psql -U postgres -c "SELECT 1;"
# Should output: 1

# Check DATABASE_URL
echo $DATABASE_URL
# Should be: postgresql://user:pass@localhost/orbit
```

---

## 📞 Support

### When stuck, check:
1. **PHASE_5_QUICK_START.md** - Detailed task descriptions
2. **PHASE_5_WEEK1_REPORT.md** - Where to document issues
3. **Code comments** - Most functions have inline documentation
4. **Test files** - Tests show expected behavior

### Common Patterns (copy-paste)

**DB Query:**
```typescript
const result = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
return result.rows[0];
```

**Error Handling:**
```typescript
try {
  // Operation
  return { statusCode: 201, body: JSON.stringify({ success: true }) };
} catch (error) {
  console.error('Error:', error);
  return { statusCode: 500, body: JSON.stringify({ error: 'INTERNAL_ERROR' }) };
}
```

**JWT Generation:**
```typescript
import { generateJWT } from '../services/jwt';
const token = generateJWT(agentId);
```

---

## 🎊 Success!

**When all tasks are done:**
1. ✅ 8 tables created
2. ✅ TypeScript compiles
3. ✅ JWT tests pass
4. ✅ Registration endpoint works
5. ✅ At least 1 agent in database
6. ✅ All tests pass
7. ✅ Coverage > 80%
8. ✅ Code pushed to branch
9. ✅ Report filed

**Grade:** A+ for Phase 5 Week 1 completion! 🚀
