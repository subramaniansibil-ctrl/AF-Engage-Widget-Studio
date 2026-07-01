ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
