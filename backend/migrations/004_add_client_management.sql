ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS mobile_number TEXT NOT NULL DEFAULT 'Not provided',
  ADD COLUMN IF NOT EXISTS assigned_advisor TEXT NOT NULL DEFAULT 'Advisor User',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS investment_goal TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS portfolio_reference TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_status_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_advisor ON clients(assigned_advisor);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
