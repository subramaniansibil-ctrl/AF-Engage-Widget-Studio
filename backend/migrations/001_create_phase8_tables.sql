CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADVISOR', 'CLIENT', 'ADMIN')),
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  email TEXT NOT NULL UNIQUE,
  risk_profile TEXT NOT NULL CHECK (risk_profile IN ('CONSERVATIVE', 'MODERATE', 'GROWTH', 'AGGRESSIVE')),
  retirement_stage TEXT NOT NULL CHECK (retirement_stage IN ('ACCUMULATION', 'PRE_RETIREMENT', 'RETIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  total_value BIGINT NOT NULL,
  savings_pot_balance BIGINT NOT NULL,
  retirement_pot_balance BIGINT NOT NULL,
  monthly_contribution BIGINT NOT NULL,
  retirement_goal_target_amount BIGINT NOT NULL,
  retirement_goal_target_age INTEGER NOT NULL,
  retirement_goal_progress INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investment_allocations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  percentage NUMERIC(6,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS widgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'DRAFT')),
  default_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_data_points TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS widget_configurations (
  id TEXT PRIMARY KEY,
  widget_id TEXT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_assignments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  configuration_id TEXT NOT NULL REFERENCES widget_configurations(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_history (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_client_id ON portfolios(client_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_assignments_client_id ON dashboard_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_client_id ON simulation_history(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
