-- Multi-Agent AI Platform - Supabase Schema
-- Execute this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- AGENTS TABLE
-- ============================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('planner', 'research', 'execution', 'review', 'custom')),
  description TEXT,
  system_prompt TEXT NOT NULL,
  capabilities JSONB DEFAULT '[]', -- Array of tool names
  config JSONB DEFAULT '{}', -- Model, temperature, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_active ON agents(is_active);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  context JSONB DEFAULT '{}', -- Session metadata
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'agent')),
  content TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}', -- Tool calls, tokens, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_agent ON messages(agent_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'research', 'execution', 'analysis', etc.
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_conversation ON tasks(conversation_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_agent ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- ============================================
-- WORKFLOWS TABLE
-- ============================================
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'event', 'webhook')),
  trigger_config JSONB DEFAULT '{}', -- Cron expression, event filters, etc.
  steps JSONB NOT NULL, -- Array of workflow steps
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_trigger ON workflows(trigger_type);
CREATE INDEX idx_workflows_next_run ON workflows(next_run_at) WHERE is_active = true;

-- ============================================
-- WORKFLOW_EXECUTIONS TABLE
-- ============================================
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB DEFAULT '{}',
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER NOT NULL,
  output JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at DESC);

-- ============================================
-- MEMORY_EMBEDDINGS TABLE (RAG)
-- ============================================
CREATE TABLE memory_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_user ON memory_embeddings(user_id);
CREATE INDEX idx_memory_conversation ON memory_embeddings(conversation_id);
-- Vector similarity search index
CREATE INDEX idx_memory_embedding ON memory_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TOOLS TABLE
-- ============================================
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'email', 'calendar', 'web', 'custom'
  description TEXT NOT NULL,
  schema JSONB NOT NULL, -- JSON Schema for parameters
  handler_type VARCHAR(50) NOT NULL, -- 'api', 'function', 'webhook'
  handler_config JSONB NOT NULL,
  requires_auth BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_active ON tools(is_active);

-- ============================================
-- AGENT_TOOLS (Many-to-Many)
-- ============================================
CREATE TABLE agent_tools (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_id, tool_id)
);

-- ============================================
-- LOGS TABLE
-- ============================================
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_agent ON logs(agent_id);
CREATE INDEX idx_logs_task ON logs(task_id);
CREATE INDEX idx_logs_created ON logs(created_at DESC);

-- ============================================
-- API_KEYS TABLE (for external integrations)
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL, -- 'gmail', 'calendar', 'slack', etc.
  encrypted_key TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_service ON api_keys(service);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic search
CREATE OR REPLACE FUNCTION match_memory_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memory_embeddings.id,
    memory_embeddings.content,
    1 - (memory_embeddings.embedding <=> query_embedding) as similarity,
    memory_embeddings.metadata
  FROM memory_embeddings
  WHERE memory_embeddings.user_id = filter_user_id
    AND 1 - (memory_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY memory_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all user-specific tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies (users can only access their own data)
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workflows" ON workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workflows" ON workflows FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memory" ON memory_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory" ON memory_embeddings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own api keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA (Default Agents)
-- ============================================

INSERT INTO agents (name, type, description, system_prompt, capabilities, config) VALUES
(
  'Planner Agent',
  'planner',
  'Breaks down complex tasks into actionable steps',
  'You are a strategic planning agent. Your role is to analyze user requests, break them into logical steps, and create execution plans. Be thorough and consider dependencies.',
  '["task_decomposition", "priority_assignment", "dependency_analysis"]',
  '{"model": "gpt-4-turbo-preview", "temperature": 0.7, "max_tokens": 2000}'
),
(
  'Research Agent',
  'research',
  'Gathers information from various sources',
  'You are a research agent. Your role is to find accurate information, synthesize data from multiple sources, and provide comprehensive answers. Always cite sources.',
  '["web_search", "document_analysis", "data_extraction"]',
  '{"model": "gpt-4-turbo-preview", "temperature": 0.5, "max_tokens": 3000}'
),
(
  'Execution Agent',
  'execution',
  'Executes tasks and interacts with external systems',
  'You are an execution agent. Your role is to perform actions, call APIs, and complete tasks. Be precise and handle errors gracefully.',
  '["api_calls", "email_send", "calendar_manage", "file_operations"]',
  '{"model": "gpt-4-turbo-preview", "temperature": 0.3, "max_tokens": 1500}'
),
(
  'Review Agent',
  'review',
  'Reviews outputs and ensures quality',
  'You are a quality review agent. Your role is to verify results, check for errors, and ensure outputs meet requirements. Be critical and thorough.',
  '["output_validation", "error_detection", "quality_check"]',
  '{"model": "gpt-4-turbo-preview", "temperature": 0.4, "max_tokens": 2000}'
);

-- ============================================
-- VIEWS (for common queries)
-- ============================================

CREATE VIEW active_tasks_summary AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.priority,
  a.name as agent_name,
  u.email as user_email,
  t.created_at,
  t.updated_at
FROM tasks t
LEFT JOIN agents a ON t.assigned_agent_id = a.id
LEFT JOIN users u ON t.user_id = u.id
WHERE t.status IN ('pending', 'running')
ORDER BY t.priority DESC, t.created_at ASC;

CREATE VIEW conversation_stats AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at,
  c.created_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.status = 'active'
GROUP BY c.id;

-- ============================================
-- PERFORMANCE NOTES
-- ============================================
-- 1. Partition logs table by month for better performance
-- 2. Use connection pooling (pg-pool) with max 20 connections
-- 3. Enable query caching in Redis for frequent reads
-- 4. Use prepared statements for all queries
-- 5. Monitor slow queries with pg_stat_statements
