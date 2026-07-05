-- MatchDay Database Schema
-- World Cup prediction game with USDC prizes on Solana
-- Powered by TxLINE real-time match data

-- ============================================================
-- MATCH DATA (synced from TxLINE)
-- ============================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  short_name TEXT,
  country TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txline_fixture_id BIGINT UNIQUE NOT NULL,
  home_team_id UUID REFERENCES teams(id) NOT NULL,
  away_team_id UUID REFERENCES teams(id) NOT NULL,
  fixture_group TEXT NOT NULL,       -- 'Group Stage', 'Round of 32', 'Quarter Final', etc.
  matchday INT,                      -- optional grouping for related fixtures
  kickoff TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'NS' CHECK (status IN (
    'NS',    -- not started
    'H1',    -- first half
    'HT',    -- half time
    'H2',    -- second half
    'FT',    -- full time (regular)
    'ET',    -- extra time in progress
    'FET',   -- full time after extra time
    'PEN',   -- penalty shootout in progress
    'FPEN',  -- full time after penalties
    'PST',   -- postponed
    'CANC',  -- cancelled
    'INT'    -- interrupted
  )),
  home_score INT,
  away_score INT,
  home_score_ht INT,                 -- half-time scores for more granular data
  away_score_ht INT,
  raw_response JSONB,                -- full TxLINE score snapshot
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTESTS & ENTRIES
-- ============================================================

CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entry_fee NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
  rake_pct NUMERIC(4, 2) NOT NULL DEFAULT 10.00,
  max_entries INT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',      -- accepting entries
    'locked',    -- deadline passed, matches in progress
    'scoring',   -- matches done, calculating points
    'settled',   -- prizes distributed
    'cancelled'  -- contest cancelled, refunds issued
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contest_fixtures (
  contest_id UUID REFERENCES contests(id) NOT NULL,
  fixture_id UUID REFERENCES fixtures(id) NOT NULL,
  PRIMARY KEY (contest_id, fixture_id)
);

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  contest_id UUID REFERENCES contests(id) NOT NULL,
  total_points INT DEFAULT 0,
  rank INT,
  entry_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, contest_id)
);

-- ============================================================
-- PREDICTIONS (replaces entry_players)
-- ============================================================

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  fixture_id UUID REFERENCES fixtures(id) NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN (
    'match_result',       -- home / draw / away
    'correct_score',      -- e.g. '2-1'
    'both_teams_score',   -- yes / no
    'over_under_2_5'      -- over / under
  )),
  predicted_value TEXT NOT NULL,
  points_awarded INT DEFAULT 0,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entry_id, fixture_id, prediction_type)
);

-- ============================================================
-- PAYOUTS
-- ============================================================

CREATE TABLE payout_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) NOT NULL,
  min_rank INT NOT NULL,
  max_rank INT NOT NULL,
  pct_of_pool NUMERIC(5, 2) NOT NULL,
  CHECK (min_rank <= max_rank),
  CHECK (pct_of_pool > 0 AND pct_of_pool <= 100)
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  entry_id UUID REFERENCES entries(id) NOT NULL,
  rank INT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'confirmed',
    'failed'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AI ASSISTANT CHAT HISTORY
-- ============================================================

CREATE TABLE assistant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES assistant_threads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AGENT CONFIGURATION & AUDIT
-- ============================================================

CREATE TABLE agent_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  total_deposited NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_spend_per_contest NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
  max_contests_per_week INT NOT NULL DEFAULT 3,
  vault_pda TEXT,
  deposit_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES agent_budgets(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'max_entry_fee',
    'min_entries',
    'max_entries',
    'prediction_strategy',     -- e.g. {"strategy": "conservative"} or {"strategy": "aggressive"}
    'confidence_threshold',    -- e.g. {"min_confidence": 0.6}
    'fixture_group',           -- e.g. {"groups": ["Group Stage"]}
    'risk_level'
  )),
  rule_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  budget_id UUID REFERENCES agent_budgets(id) NOT NULL,
  contest_id UUID REFERENCES contests(id),
  entry_id UUID REFERENCES entries(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'evaluate_contest',
    'build_predictions',
    'submit_entry',
    'payment_sent',
    'payment_confirmed',
    'payment_failed',
    'skipped_contest'
  )),
  reasoning TEXT,
  prediction_data JSONB,         -- agent's predictions + confidence scores
  amount NUMERIC(12, 2),
  tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'success',
    'failed'
  )),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SYNC TRACKING
-- ============================================================

CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'teams',
    'fixtures',
    'scores'
  )),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN (
    'started',
    'completed',
    'failed'
  )),
  records_processed INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fixture lookups
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_kickoff ON fixtures(kickoff);
CREATE INDEX idx_fixtures_group ON fixtures(fixture_group);
CREATE INDEX idx_fixtures_matchday ON fixtures(matchday);

-- Contest & entry lookups
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_deadline ON contests(deadline);
CREATE INDEX idx_entries_contest ON entries(contest_id);
CREATE INDEX idx_entries_user ON entries(user_id);
CREATE INDEX idx_entries_points ON entries(contest_id, total_points DESC);

-- Prediction lookups
CREATE INDEX idx_predictions_entry ON predictions(entry_id);
CREATE INDEX idx_predictions_fixture ON predictions(fixture_id);
CREATE INDEX idx_predictions_type ON predictions(prediction_type);

-- Payout lookups
CREATE INDEX idx_payouts_contest ON payouts(contest_id);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Assistant lookups
CREATE INDEX idx_assistant_threads_user ON assistant_threads(user_id);
CREATE INDEX idx_assistant_messages_thread ON assistant_messages(thread_id);

-- Agent lookups
CREATE INDEX idx_agent_budgets_user ON agent_budgets(user_id);
CREATE INDEX idx_agent_budgets_active ON agent_budgets(is_active) WHERE is_active = true;
CREATE INDEX idx_agent_rules_budget ON agent_rules(budget_id);
CREATE INDEX idx_agent_actions_user ON agent_actions(user_id);
CREATE INDEX idx_agent_actions_budget ON agent_actions(budget_id);
CREATE INDEX idx_agent_actions_contest ON agent_actions(contest_id);
CREATE INDEX idx_agent_actions_type ON agent_actions(action_type);
CREATE INDEX idx_agent_actions_created ON agent_actions(created_at DESC);

-- Sync tracking
CREATE INDEX idx_sync_log_type ON sync_log(sync_type);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fixtures_updated_at BEFORE UPDATE ON fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contests_updated_at BEFORE UPDATE ON contests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assistant_threads_updated_at BEFORE UPDATE ON assistant_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agent_budgets_updated_at BEFORE UPDATE ON agent_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();