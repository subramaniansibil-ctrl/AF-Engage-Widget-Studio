INSERT INTO clients (id, name, age, email, risk_profile, retirement_stage) VALUES
  ('client-001', 'Avery Chen', 42, 'avery.chen@example.com', 'MODERATE', 'ACCUMULATION'),
  ('client-002', 'Jordan Patel', 35, 'jordan.patel@example.com', 'GROWTH', 'ACCUMULATION'),
  ('client-003', 'Sam Rivera', 61, 'sam.rivera@example.com', 'CONSERVATIVE', 'PRE_RETIREMENT')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  email = EXCLUDED.email,
  risk_profile = EXCLUDED.risk_profile,
  retirement_stage = EXCLUDED.retirement_stage;

INSERT INTO users (id, name, email, password_hash, role, client_id) VALUES
  ('user_advisor_001', 'Advisor User', 'advisor@afengage.com', 'password123', 'ADVISOR', NULL),
  ('user_client_001', 'Avery Chen', 'client@afengage.com', 'password123', 'CLIENT', 'client-001'),
  ('user_admin_001', 'Admin User', 'admin@afengage.com', 'password123', 'ADMIN', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  client_id = EXCLUDED.client_id;

INSERT INTO portfolios (
  id, client_id, total_value, savings_pot_balance, retirement_pot_balance, monthly_contribution,
  retirement_goal_target_amount, retirement_goal_target_age, retirement_goal_progress
) VALUES
  ('portfolio-001', 'client-001', 875000, 96000, 515000, 3200, 1800000, 62, 28),
  ('portfolio-002', 'client-002', 245000, 41000, 122000, 2100, 1250000, 65, 9),
  ('portfolio-003', 'client-003', 1325000, 210000, 865000, 4500, 2100000, 66, 41)
ON CONFLICT (id) DO UPDATE SET
  total_value = EXCLUDED.total_value,
  savings_pot_balance = EXCLUDED.savings_pot_balance,
  retirement_pot_balance = EXCLUDED.retirement_pot_balance,
  monthly_contribution = EXCLUDED.monthly_contribution,
  retirement_goal_target_amount = EXCLUDED.retirement_goal_target_amount,
  retirement_goal_target_age = EXCLUDED.retirement_goal_target_age,
  retirement_goal_progress = EXCLUDED.retirement_goal_progress;

INSERT INTO investment_allocations (id, portfolio_id, label, category, percentage, sort_order) VALUES
  ('allocation-001', 'portfolio-001', 'Equities', 'stocks', 58, 1),
  ('allocation-002', 'portfolio-001', 'Fixed income', 'bonds', 28, 2),
  ('allocation-003', 'portfolio-001', 'Cash', 'cash', 8, 3),
  ('allocation-004', 'portfolio-001', 'Alternatives', 'alternatives', 6, 4),
  ('allocation-005', 'portfolio-002', 'Equities', 'stocks', 72, 1),
  ('allocation-006', 'portfolio-002', 'Fixed income', 'bonds', 14, 2),
  ('allocation-007', 'portfolio-002', 'Cash', 'cash', 9, 3),
  ('allocation-008', 'portfolio-002', 'Alternatives', 'alternatives', 5, 4),
  ('allocation-009', 'portfolio-003', 'Equities', 'stocks', 38, 1),
  ('allocation-010', 'portfolio-003', 'Fixed income', 'bonds', 48, 2),
  ('allocation-011', 'portfolio-003', 'Cash', 'cash', 10, 3),
  ('allocation-012', 'portfolio-003', 'Alternatives', 'alternatives', 4, 4)
ON CONFLICT (id) DO UPDATE SET percentage = EXCLUDED.percentage;

INSERT INTO widgets (id, name, description, category, icon, status, default_configuration, required_data_points) VALUES
  (
    'two-pot-impact',
    'Two-Pot Impact',
    'Shows how savings-pot withdrawals can affect long-term retirement outcomes.',
    'Retirement planning',
    'Scale',
    'ACTIVE',
    '{"projectionYears":"20","withdrawalScenario":"Moderate withdrawal","includeTaxEstimate":"true","showEducationPrompts":"true"}',
    ARRAY['savingsPotBalance','retirementPotBalance','monthlyContribution','retirementGoal']
  ),
  (
    'onefee-wealth-reclaim',
    'Onefee Wealth Reclaim',
    'Illustrates fee drag and the compounding value of reclaiming unnecessary investment costs.',
    'Portfolio efficiency',
    'RefreshCcw',
    'ACTIVE',
    '{"feeComparison":"1.25% vs 0.75%","projectionYears":"15","showCostBreakdown":"true","includeAdvisorNotes":"true"}',
    ARRAY['portfolioValue','investmentAllocation','monthlyContribution']
  ),
  (
    'income-sustainability',
    'Income Sustainability',
    'Models whether planned retirement income can remain sustainable across market conditions.',
    'Income planning',
    'LineChart',
    'ACTIVE',
    '{"projectionYears":"30","scenario":"Balanced market","includeInflation":"true","showLongevityBand":"true"}',
    ARRAY['retirementPotBalance','monthlyContribution','retirementGoal']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  status = EXCLUDED.status,
  default_configuration = EXCLUDED.default_configuration,
  required_data_points = EXCLUDED.required_data_points;

INSERT INTO widget_configurations (id, widget_id, client_id, options) VALUES
  ('config-seeded-001', 'two-pot-impact', 'client-001', '{"projectionYears":"20","scenario":"No withdrawal","advisorNote":"Review the long-term impact before accessing the savings pot."}'),
  ('config-seeded-002', 'income-sustainability', 'client-001', '{"projectionYears":"30","scenario":"Balanced market","advisorNote":"Use this to stress-test retirement income assumptions."}'),
  ('config-seeded-003', 'onefee-wealth-reclaim', 'client-001', '{"feeComparison":"1.25% vs 0.75%","projectionYears":"15","advisorNote":"Compare long-term fee leakage against the Onefee illustration.","showCostBreakdown":"true"}')
ON CONFLICT (id) DO UPDATE SET options = EXCLUDED.options;

INSERT INTO dashboard_assignments (id, client_id, widget_id, configuration_id, published) VALUES
  ('assignment-seeded-001', 'client-001', 'two-pot-impact', 'config-seeded-001', TRUE),
  ('assignment-seeded-002', 'client-001', 'income-sustainability', 'config-seeded-002', TRUE),
  ('assignment-seeded-003', 'client-001', 'onefee-wealth-reclaim', 'config-seeded-003', TRUE)
ON CONFLICT (id) DO UPDATE SET published = EXCLUDED.published;

INSERT INTO simulation_history (id, client_id, widget_id, inputs, result, created_at) VALUES
  ('simulation-001', 'client-001', 'two-pot-impact', '{"projectionYears":"20","scenario":"No withdrawal"}', 'Retirement goal remains on track at the current contribution rate.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET result = EXCLUDED.result;

INSERT INTO notifications (id, title, message, type, read, created_at) VALUES
  ('notification-001', 'Dashboard published', 'Avery Chen''s personalized dashboard is live.', 'success', FALSE, NOW() - INTERVAL '25 minutes'),
  ('notification-002', 'Simulation saved', 'Two-Pot Impact illustration was saved by a client.', 'info', FALSE, NOW() - INTERVAL '2 hours'),
  ('notification-003', 'Review high-risk segment', 'Three clients have aggressive allocations near retirement.', 'warning', TRUE, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  type = EXCLUDED.type;

INSERT INTO audit_logs (id, actor, action, entity, created_at) VALUES
  ('audit-001', 'Advisor User', 'Published client dashboard', 'client-001', NOW() - INTERVAL '25 minutes'),
  ('audit-002', 'Avery Chen', 'Saved two-pot simulation', 'two-pot-impact', NOW() - INTERVAL '2 hours'),
  ('audit-003', 'Admin User', 'Reviewed platform analytics', 'analytics', NOW() - INTERVAL '8 hours'),
  ('audit-004', 'Advisor User', 'Assigned widget', 'onefee-wealth-reclaim', NOW() - INTERVAL '28 hours')
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action;
