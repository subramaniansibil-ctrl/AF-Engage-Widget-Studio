ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS monthly_income BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_expenses BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_savings BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_worth BIGINT NOT NULL DEFAULT 0;

UPDATE portfolios
SET
  monthly_income = CASE id
    WHEN 'portfolio-001' THEN 68000
    WHEN 'portfolio-002' THEN 52000
    WHEN 'portfolio-003' THEN 76000
    ELSE monthly_income
  END,
  monthly_expenses = CASE id
    WHEN 'portfolio-001' THEN 41000
    WHEN 'portfolio-002' THEN 36000
    WHEN 'portfolio-003' THEN 50000
    ELSE monthly_expenses
  END,
  monthly_savings = CASE id
    WHEN 'portfolio-001' THEN 27000
    WHEN 'portfolio-002' THEN 16000
    WHEN 'portfolio-003' THEN 26000
    ELSE monthly_savings
  END,
  net_worth = CASE id
    WHEN 'portfolio-001' THEN 1250000
    WHEN 'portfolio-002' THEN 420000
    WHEN 'portfolio-003' THEN 1880000
    ELSE net_worth
  END
WHERE id IN ('portfolio-001', 'portfolio-002', 'portfolio-003');
