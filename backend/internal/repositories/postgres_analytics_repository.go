package repositories

import (
	"context"
	"database/sql"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type widgetUsageRow struct {
	WidgetID        string
	WidgetName      string
	AssignedCount   int
	PublishedCount  int
	SimulationCount int
}

type postgresAnalyticsRepository struct {
	db *sql.DB
}

func NewPostgresAnalyticsRepository(db *sql.DB) AnalyticsRepository {
	return &postgresAnalyticsRepository{db: db}
}

func (r *postgresAnalyticsRepository) GetAdvisorAnalytics(ctx context.Context) (models.AnalyticsSummary, error) {
	var summary models.AnalyticsSummary
	err := r.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM clients),
			(SELECT COUNT(*) FROM widgets),
			(SELECT COUNT(*) FROM simulation_history),
			(SELECT COUNT(DISTINCT client_id) FROM dashboard_assignments WHERE published = TRUE)
	`).Scan(&summary.TotalUsers, &summary.TotalClients, &summary.TotalWidgets, &summary.TotalSimulations, &summary.PublishedDashboards)
	if err != nil {
		return models.AnalyticsSummary{}, err
	}
	usage, err := r.GetWidgetUsage(ctx)
	if err != nil {
		return models.AnalyticsSummary{}, err
	}
	summary.WidgetUsage = usage
	summary.MostUsedWidget = mostUsedWidget(usage)
	if summary.TotalClients > 0 {
		summary.ClientEngagement = int(float64(summary.PublishedDashboards) / float64(summary.TotalClients) * 100)
	}
	return summary, nil
}

func (r *postgresAnalyticsRepository) GetWidgetUsage(ctx context.Context) ([]models.WidgetUsage, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT w.id, w.name,
			COALESCE(assigned_counts.assigned_count, 0),
			COALESCE(assigned_counts.published_count, 0),
			COALESCE(simulation_counts.simulation_count, 0)
		FROM widgets w
		LEFT JOIN (
			SELECT widget_id, COUNT(*) AS assigned_count, COUNT(*) FILTER (WHERE published = TRUE) AS published_count
			FROM dashboard_assignments
			GROUP BY widget_id
		) assigned_counts ON assigned_counts.widget_id = w.id
		LEFT JOIN (
			SELECT widget_id, COUNT(*) AS simulation_count
			FROM simulation_history
			GROUP BY widget_id
		) simulation_counts ON simulation_counts.widget_id = w.id
		ORDER BY COALESCE(simulation_counts.simulation_count, 0) DESC, w.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usageRows := []widgetUsageRow{}
	for rows.Next() {
		var item widgetUsageRow
		if err := rows.Scan(&item.WidgetID, &item.WidgetName, &item.AssignedCount, &item.PublishedCount, &item.SimulationCount); err != nil {
			return nil, err
		}
		usageRows = append(usageRows, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return widgetUsageRowsToModels(usageRows), nil
}

func widgetUsageRowsToModels(rows []widgetUsageRow) []models.WidgetUsage {
	usage := make([]models.WidgetUsage, 0, len(rows))
	for _, row := range rows {
		usage = append(usage, models.WidgetUsage{
			WidgetID:        row.WidgetID,
			WidgetName:      row.WidgetName,
			AssignedCount:   row.AssignedCount,
			PublishedCount:  row.PublishedCount,
			SimulationCount: row.SimulationCount,
		})
	}
	return usage
}

func (r *postgresAnalyticsRepository) ListNotifications(ctx context.Context) ([]models.Notification, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, title, message, type, read, created_at
		FROM notifications
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var notification models.Notification
		if err := rows.Scan(&notification.ID, &notification.Title, &notification.Message, &notification.Type, &notification.Read, &notification.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	}
	return notifications, rows.Err()
}

func (r *postgresAnalyticsRepository) MarkNotificationRead(ctx context.Context, id string) (models.Notification, error) {
	var notification models.Notification
	err := r.db.QueryRowContext(ctx, `
		UPDATE notifications
		SET read = TRUE
		WHERE id = $1
		RETURNING id, title, message, type, read, created_at
	`, id).Scan(&notification.ID, &notification.Title, &notification.Message, &notification.Type, &notification.Read, &notification.CreatedAt)
	if err == sql.ErrNoRows {
		return models.Notification{}, ErrNotificationNotFound
	}
	return notification, err
}

func (r *postgresAnalyticsRepository) ListAuditLogs(ctx context.Context, page, pageSize int) ([]models.AuditLog, int, error) {
	if pageSize <= 0 {
		pageSize = 10
	}
	if page <= 0 {
		page = 1
	}
	countQuery := `SELECT COUNT(*) FROM audit_logs`
	var totalItems int
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&totalItems); err != nil {
		return nil, 0, err
	}
	totalPages := (totalItems + pageSize - 1) / pageSize
	if totalPages < 1 {
		totalPages = 1
	}
	if page > totalPages {
		page = totalPages
	}
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, actor, action, entity, created_at
		FROM audit_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	logs := []models.AuditLog{}
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(&log.ID, &log.Actor, &log.Action, &log.Entity, &log.CreatedAt); err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}
	return logs, totalItems, rows.Err()
}
