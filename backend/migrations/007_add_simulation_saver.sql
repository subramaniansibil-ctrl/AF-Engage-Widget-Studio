ALTER TABLE simulation_history
  ADD COLUMN IF NOT EXISTS saved_by_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_by_name TEXT NOT NULL DEFAULT 'Client',
  ADD COLUMN IF NOT EXISTS saved_by_role TEXT NOT NULL DEFAULT 'CLIENT';

CREATE INDEX IF NOT EXISTS idx_simulation_history_saved_by
  ON simulation_history(saved_by_role, saved_by_id);
