package repositories

import (
	"context"
	"database/sql"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

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
			COUNT(da.id),
			COUNT(da.id) FILTER (WHERE da.published = TRUE),
			COUNT(sh.id)
		FROM widgets w
		LEFT JOIN dashboard_assignments da ON da.widget_id = w.id
		LEFT JOIN simulation_history sh ON sh.widget_id = w.id
		GROUP BY w.id, w.name
		ORDER BY COUNT(sh.id) DESC, w.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usage := []models.WidgetUsage{}
	for rows.Next() {
		var item models.WidgetUsage
		if err := rows.Scan(&item.WidgetID, &item.WidgetName, &item.AssignedCount, &item.PublishedCount, &item.SimulationCount); err != nil {
			return nil, err
		}
		usage = append(usage, item)
	}
	return usage, rows.Err()
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

func (r *postgresAnalyticsRepository) ListAuditLogs(ctx context.Context) ([]models.AuditLog, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, actor, action, entity, created_at
		FROM audit_logs
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []models.AuditLog{}
	for rows.Next() {
		var log models.AuditLog
		if err := rows.Scan(&log.ID, &log.Actor, &log.Action, &log.Entity, &log.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, rows.Err()
}
