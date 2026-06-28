WITH ranked_assignments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY client_id, widget_id ORDER BY created_at, id) AS duplicate_number
  FROM dashboard_assignments
)
DELETE FROM dashboard_assignments
WHERE id IN (
  SELECT id
  FROM ranked_assignments
  WHERE duplicate_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dashboard_assignments_client_widget
  ON dashboard_assignments (client_id, widget_id);
