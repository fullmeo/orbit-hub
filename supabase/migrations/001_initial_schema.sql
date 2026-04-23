-- ========================================
-- ORBIT - Phase 2 Database Schema
-- Supabase PostgreSQL
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE: fans
-- ========================================
CREATE TABLE IF NOT EXISTS fans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  locale VARCHAR(10) DEFAULT 'fr-FR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_fans_email ON fans(email);

-- ========================================
-- TABLE: conversations
-- ========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  -- messages format: [{role: 'user'|'assistant', content: '...', timestamp: '2026-04-21T...'}]
  escalation_status VARCHAR(20) DEFAULT 'none' CHECK (escalation_status IN ('none', 'pending', 'contacted', 'resolved')),
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_conversations_fan_id ON conversations(fan_id);
CREATE INDEX IF NOT EXISTS idx_conversations_escalation ON conversations(escalation_status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

-- ========================================
-- TABLE: escalations (audit log for human handoff)
-- ========================================
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  triggered_keyword VARCHAR(100),
  fan_email VARCHAR(255) NOT NULL,
  fan_message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'responded', 'closed')),
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_conversation ON escalations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_created ON escalations(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Fans: public read only by email (anon role)
-- Conversations: restricted to admin (service_role) + fan by ID
-- Escalations: admin only

ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Policies for fans (anon can only insert, not read)
CREATE POLICY "Allow fan insertion" ON fans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow fan read own email" ON fans FOR SELECT USING (auth.uid() = id); -- later with auth

-- Policies for conversations (admin only via service_role)
CREATE POLICY "Admin full access" ON conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Fan read own conversations" ON conversations FOR SELECT USING (fan_id = auth.uid());

-- Policies for escalations (admin only)
CREATE POLICY "Admin full access escalations" ON escalations FOR ALL USING (auth.role() = 'service_role');

-- ========================================
// FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fans_updated_at BEFORE UPDATE ON fans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert fan on escalations (ensure fan exists)
CREATE OR REPLACE FUNCTION upsert_fan_by_email()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fans (email) VALUES (NEW.fan_email)
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upsert_fan_on_escalation BEFORE INSERT ON escalations FOR EACH ROW EXECUTE FUNCTION upsert_fan_by_email();

-- ========================================
-- SAMPLE DATA (optional)
-- ========================================
-- INSERT INTO fans (email, first_name, last_name) VALUES
--   ('test@example.com', 'Jean', 'Dupont');
