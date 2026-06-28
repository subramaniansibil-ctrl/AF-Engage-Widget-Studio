ALTER TABLE simulation_history
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Saved simulation',
  ADD COLUMN IF NOT EXISTS widget_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS results JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_simulation_history_client_widget
  ON simulation_history(client_id, widget_id, updated_at DESC);
