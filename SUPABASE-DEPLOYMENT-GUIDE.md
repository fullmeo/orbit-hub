# 🔐 Supabase Deployment Guide - Phase 2

**Date Created:** April 23, 2026  
**Purpose:** PostgreSQL infrastructure for fan management + chat escalation  
**Status:** Ready for deployment

---

## What This Does

Supabase schema enables Phase 2 infrastructure:

```
✅ Fan email list (fans table)
✅ Chat conversation history (conversations table)
✅ Human escalation system (escalations table)
✅ Audit logging for transparency
```

---

## Database Tables

### 1. **fans** (Email List Management)
```sql
Columns:
├─ id (UUID, primary key)
├─ email (VARCHAR unique, required)
├─ first_name, last_name (VARCHAR, optional)
├─ locale (VARCHAR, default 'fr-FR')
├─ created_at, updated_at (TIMESTAMPTZ)

Indexes:
└─ idx_fans_email (for lookup optimization)

Purpose:
└─ Store fan/customer data from chat widget + email signups
```

### 2. **conversations** (Chat History & Escalation Tracking)
```sql
Columns:
├─ id (UUID, primary key)
├─ fan_id (UUID, foreign key to fans)
├─ messages (JSONB array)
│  └─ Format: [{role: 'user'|'assistant', content: '...', timestamp}]
├─ escalation_status (VARCHAR, check: 'none'|'pending'|'contacted'|'resolved')
├─ escalated_at, resolved_at (TIMESTAMPTZ, optional)
├─ notes (TEXT, optional)
├─ created_at, updated_at (TIMESTAMPTZ)

Indexes:
├─ idx_conversations_fan_id
├─ idx_conversations_escalation
└─ idx_conversations_created

Purpose:
└─ Store fan-chat interactions + track when escalation to human is needed
```

### 3. **escalations** (Audit Log for Human Handoff)
```sql
Columns:
├─ id (UUID, primary key)
├─ conversation_id (UUID, foreign key to conversations)
├─ triggered_keyword (VARCHAR, what triggered escalation)
├─ fan_email (VARCHAR, denormalized for quick lookup)
├─ fan_message (TEXT, the message that triggered escalation)
├─ status (VARCHAR, check: 'pending'|'notified'|'responded'|'closed')
├─ notified_at, responded_at (TIMESTAMPTZ, optional)
├─ admin_notes (TEXT, optional)
├─ created_at (TIMESTAMPTZ)

Indexes:
├─ idx_escalations_conversation
├─ idx_escalations_status
└─ idx_escalations_created

Purpose:
└─ Track when conversations need human help + log outcomes
└─ Enable admin dashboard for escalation management
```

---

## Security (Row-Level Security)

```
fans table:
├─ Public: Can INSERT (signup)
└─ Restricted: Can only SELECT own email (via auth)

conversations table:
├─ Admin (service_role): Full access
└─ Fans: Can only SELECT own conversations (by fan_id)

escalations table:
└─ Admin only: Full access (service_role)
```

---

## Database Functions & Triggers

### Auto-Update Timestamps
```
Trigger: update_updated_at_column
Tables: fans, conversations
Behavior: Automatically sets updated_at = NOW() on every update
```

### Auto-Upsert Fan on Escalation
```
Trigger: upsert_fan_on_escalation
Tables: escalations → fans
Behavior: Automatically creates fan record if doesn't exist
Purpose: Ensures fan exists before escalation logging
```

---

## Deployment Steps

### Step 1: Create Supabase Project

```bash
# Go to: https://app.supabase.com
# Create new project
# Name: orbit-allyson (or similar)
# Region: EU (Frankfurt or London)
# Database password: Strong password
# Wait for project creation (2-3 minutes)
```

### Step 2: Run Migrations

```bash
# Option A: Via Supabase Dashboard
├─ Go to: SQL Editor
├─ Create new query
├─ Copy contents of: supabase/migrations/001_initial_schema.sql
├─ Run query
└─ Tables created

# Option B: Via Supabase CLI (if installed)
cd supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

### Step 3: Configure RLS Policies

```
Policies are defined in the migration script.
Verify in Supabase Dashboard:
├─ Go to: Authentication → Policies
├─ Verify: fans, conversations, escalations tables have policies
└─ Status: Should show "RLS enabled"
```

### Step 4: Get API Keys

```bash
# In Supabase Dashboard:
├─ Go to: Settings → API
├─ Copy: Project URL (e.g., https://YOUR_PROJECT.supabase.co)
├─ Copy: anon key (public key, safe to expose)
├─ Copy: service_role key (KEEP SECRET, server-only)

# Add to netlify.toml:
[env.production]
  environment = {
    SUPABASE_URL = "https://YOUR_PROJECT.supabase.co",
    SUPABASE_ANON_KEY = "YOUR_ANON_KEY"
  }

# Add to .env.local (development):
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Step 5: Test with Dummy Data

```sql
-- Test fans table
INSERT INTO fans (email, first_name, last_name) 
VALUES 
  ('test1@example.com', 'Jean', 'Dupont'),
  ('test2@example.com', 'Marie', 'Martin');

-- Test conversations table
INSERT INTO conversations (fan_id, messages, escalation_status)
VALUES 
  (
    (SELECT id FROM fans WHERE email = 'test1@example.com'),
    '[{"role": "user", "content": "Hello", "timestamp": "2026-04-23T10:00:00Z"}]'::jsonb,
    'none'
  );

-- Verify data
SELECT * FROM fans;
SELECT * FROM conversations;
```

---

## Integration with Frontend

### fan-chat-widget.js

```javascript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// On chat message:
1. Create or get fan record (by email)
2. Upsert conversation (fan_id + messages array)
3. If escalation keyword detected:
   └─ Create escalations record
   └─ Send Brevo email notification

// Example:
async function saveMessage(fanEmail, message) {
  // Get or create fan
  const { data: fan } = await supabase
    .from('fans')
    .upsert({ email: fanEmail }, { onConflict: 'email' })
  
  // Add message to conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert({
      fan_id: fan.id,
      messages: [...existingMessages, { role: 'user', content: message }]
    })
  
  return conversation
}
```

---

## Phase 2 Integration Timeline

```
Jun 24: Phase 2 begins
  ├─ Week 1: Deploy Supabase
  ├─ Week 2+: Fan data flowing
  ├─ Month 1: Escalations tracked
  └─ Month 2: Admin dashboard operational

Key Metrics:
├─ Fans table: Growth of email list
├─ Conversations table: Chat volume & quality
└─ Escalations table: Human intervention rate (target: <10%)
```

---

## Cost

### Supabase Pricing

```
Free Tier:
├─ 500 MB storage
├─ 2 GB bandwidth/month
├─ Email auth
└─ Suitable for < 10,000 fans

Pro Tier (if needed):
├─ $25/month base
├─ $0.25 per GB storage
├─ $0.03 per GB bandwidth
└─ Good for 10,000+ fans
```

### ORBIT Phase 2 Projection

```
Month 1: 100-300 fans (FREE TIER)
Month 2: 300-500 fans (FREE TIER)
Month 3: 500-1,000 fans (UPGRADE TO PRO = ~$25/month)
Month 6: 2,000+ fans (PRO tier adequate)
```

---

## Monitoring & Maintenance

### Admin Dashboard (To Build)

```
View:
├─ Total fans (count)
├─ Active conversations (last 7 days)
├─ Pending escalations (priority alerts)
├─ Escalation resolution time (avg)
├─ Chat sentiment (positive/negative trending)
└─ Email opt-out rate

Tools:
├─ Supabase Dashboard → SQL Editor (quick queries)
├─ Supabase Dashboard → Table Editor (manual review)
└─ Future: Custom admin UI (Svelte/React)
```

### Common Queries

```sql
-- Count total fans
SELECT COUNT(*) FROM fans;

-- List pending escalations
SELECT * FROM escalations 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Average conversation length
SELECT 
  fan_id, 
  COUNT(messages) as message_count,
  created_at
FROM conversations
GROUP BY fan_id, created_at;

-- Escalation rate (%)
SELECT 
  COUNT(DISTINCT conversation_id) as escalated,
  (SELECT COUNT(*) FROM conversations) as total,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM conversations), 2) as rate
FROM escalations;
```

---

## Troubleshooting

### Issue: "CORS error" when connecting

**Solution:**
```
Supabase Dashboard → Settings → API → CORS
Add frontend domain to allowed origins:
├─ Development: http://localhost:3000
├─ Production: https://orbit-allysonglado.netlify.app
└─ Save
```

### Issue: RLS policy denying access

**Solution:**
```
Check:
├─ User is authenticated (for conversations)
├─ anon key is being used (for public operations)
├─ Email matches in fans table

Debug:
├─ Check Supabase logs: Settings → Logs
├─ Verify RLS policies: Authentication → Policies
```

### Issue: Migrations failed

**Solution:**
```
Check the error in Supabase Dashboard:
├─ SQL Editor → Recent queries
├─ Look for error message
├─ Common: "UUID extension already exists"
  └─ Safe to ignore, means it's already installed

Fix: Run migrations again, skip errors
```

---

## Status

✅ **Schema complete** (created Apr 22)  
✅ **Migration file ready** (supabase/migrations/001_initial_schema.sql)  
✅ **Deployment guide** (this document)  
⏳ **Pending:** Supabase project creation  
⏳ **Pending:** Integration with fan-chat widget  
⏳ **Pending:** Admin dashboard build  

---

## Next Steps

**Week of Apr 23:**
1. Create Supabase project
2. Run migrations
3. Test with dummy data
4. Document API keys in netlify.toml

**Week of Apr 30:**
1. Integrate fan-chat widget ↔ Supabase
2. Test full flow (chat → message saved → escalation tracked)
3. Build admin dashboard view

**Week of May 7:**
1. Deploy to production
2. Monitor first escalations
3. Document results

---

**Ready for Phase 2 deployment!** 🚀
