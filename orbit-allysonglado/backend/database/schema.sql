-- ORBIT 2.0 Phase 5 PostgreSQL Schema
-- 8 core tables with indexes and comments

-- 1. AGENTS - Core agent table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('caption_generator', 'user_created', 'fan_chat', 'orchestration')),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'QUARANTINE', 'SUSPENDED', 'BLOCKED', 'BANNED')),
  trust_tier VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (trust_tier IN ('ACTIVE', 'TRUSTED', 'PREMIUM', 'FLAGGED')),
  jwt_token TEXT,
  jwt_expires_at BIGINT,
  behavior_score DECIMAL(5,2) DEFAULT 75.0,
  queries_count INT DEFAULT 0,
  registered_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_wallet ON agents(wallet_address);

-- 2. AGENTS_FAN - Fan-specific agent data
CREATE TABLE agents_fan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) NOT NULL,
  fan_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  preferred_currency VARCHAR(10) DEFAULT 'EUR' CHECK (preferred_currency IN ('EUR', 'USDC')),
  total_tips_count INT DEFAULT 0,
  total_tips_amount_usd DECIMAL(10,2) DEFAULT 0,
  chat_limit_tier VARCHAR(50) DEFAULT 'FREE' CHECK (chat_limit_tier IN ('FREE', 'UNLIMITED')),
  chat_queries_this_month INT DEFAULT 0,
  last_chat_at TIMESTAMP,
  fan_tier VARCHAR(50) DEFAULT 'FAN' CHECK (fan_tier IN ('FAN', 'SUPER_FAN', 'PATRON')),
  first_tip_at TIMESTAMP,
  last_tip_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_agents_fan_artist ON agents_fan(artist_id);
CREATE INDEX idx_agents_fan_email ON agents_fan(email);

-- 3. PAYMENTS - Transaction records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL CHECK (currency IN ('EUR', 'USDC')),
  amount_usd_equivalent DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('tip', 'merchandise', 'subscription')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_charge_id VARCHAR(255),
  x402_transaction_hash VARCHAR(255),
  artist_received DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_agent ON payments(agent_id);
CREATE INDEX idx_payments_artist ON payments(artist_id);

-- 4. FAN_CHAT_INTERACTIONS - Chat history
CREATE TABLE fan_chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  interaction_type VARCHAR(50) DEFAULT 'chat',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_chat_agent ON fan_chat_interactions(agent_id);
CREATE INDEX idx_chat_created ON fan_chat_interactions(created_at);

-- 5. THANKS_MESSAGES - AI-generated thank you messages
CREATE TABLE thanks_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  tone VARCHAR(50) DEFAULT 'poetic',
  language VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_thanks_payment ON thanks_messages(payment_id);
CREATE INDEX idx_thanks_agent ON thanks_messages(agent_id);

-- 6. ARTIST_AGENT_PERMISSIONS - Per-artist rules
CREATE TABLE artist_agent_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id VARCHAR(255) NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  permission_type VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_permissions_artist ON artist_agent_permissions(artist_id);
CREATE INDEX idx_permissions_agent ON artist_agent_permissions(agent_id);

-- 7. PENDING_PAYMENTS - Temporary payment state
CREATE TABLE pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  artist_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_intent_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_pending_agent ON pending_payments(agent_id);
CREATE INDEX idx_pending_intent ON pending_payments(payment_intent_id);

-- 8. AUDIT_LOG - Immutable action trail
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  artist_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_agent ON audit_log(agent_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
