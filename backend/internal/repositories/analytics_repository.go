package repositories

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

var ErrNotificationNotFound = errors.New("notification not found")

type AnalyticsRepository interface {
	GetAdminAnalytics(ctx context.Context) (models.AnalyticsSummary, error)
	GetAdvisorAnalytics(ctx context.Context, advisorName string) (models.AnalyticsSummary, error)
	GetWidgetUsage(ctx context.Context) ([]models.WidgetUsage, error)
	ListNotifications(ctx context.Context) ([]models.Notification, error)
	MarkNotificationRead(ctx context.Context, id string) (models.Notification, error)
	ListAuditLogs(ctx context.Context, page, pageSize int) ([]models.AuditLog, int, error)
}

type mockAnalyticsRepository struct {
	mu            sync.RWMutex
	notifications []models.Notification
	auditLogs     []models.AuditLog
	widgetUsage   []models.WidgetUsage
}

func NewMockAnalyticsRepository() AnalyticsRepository {
	now := time.Now().UTC()
	widgetUsage := []models.WidgetUsage{
		{WidgetID: "two-pot-impact", WidgetName: "Two-Pot Impact", AssignedCount: 14, PublishedCount: 11, SimulationCount: 38},
		{WidgetID: "income-sustainability", WidgetName: "Income Sustainability", AssignedCount: 10, PublishedCount: 8, SimulationCount: 24},
		{WidgetID: "onefee-wealth-reclaim", WidgetName: "Onefee Wealth Reclaim", AssignedCount: 9, PublishedCount: 7, SimulationCount: 19},
	}

	return &mockAnalyticsRepository{
		widgetUsage: widgetUsage,
		notifications: []models.Notification{
			{ID: "notification-001", Title: "Dashboard published", Message: "John Smith's personalized dashboard is live.", Type: "success", Read: false, CreatedAt: now.Add(-25 * time.Minute)},
			{ID: "notification-002", Title: "Simulation saved", Message: "Two-Pot Impact illustration was saved by a client.", Type: "info", Read: false, CreatedAt: now.Add(-2 * time.Hour)},
			{ID: "notification-003", Title: "Review high-risk segment", Message: "Three clients have aggressive allocations near retirement.", Type: "warning", Read: true, CreatedAt: now.Add(-24 * time.Hour)},
		},
		auditLogs: []models.AuditLog{
			{ID: "audit-001", Actor: "Sarah Williams", Action: "Published client dashboard", Entity: "client-001", CreatedAt: now.Add(-25 * time.Minute)},
			{ID: "audit-002", Actor: "John Smith", Action: "Saved two-pot simulation", Entity: "two-pot-impact", CreatedAt: now.Add(-2 * time.Hour)},
			{ID: "audit-003", Actor: "Admin User", Action: "Reviewed platform analytics", Entity: "analytics", CreatedAt: now.Add(-8 * time.Hour)},
			{ID: "audit-004", Actor: "Sarah Williams", Action: "Assigned widget", Entity: "onefee-wealth-reclaim", CreatedAt: now.Add(-28 * time.Hour)},
		},
	}
}

func (r *mockAnalyticsRepository) GetAdminAnalytics(ctx context.Context) (models.AnalyticsSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return models.AnalyticsSummary{
		TotalUsers:          23,
		TotalClients:        20,
		TotalWidgets:        3,
		TotalSimulations:    totalSimulations(r.widgetUsage),
		PublishedDashboards: 11,
		MostUsedWidget:      mostUsedWidget(r.widgetUsage),
		WidgetUsage:         append([]models.WidgetUsage(nil), r.widgetUsage...),
	}, nil
}

func (r *mockAnalyticsRepository) GetAdvisorAnalytics(ctx context.Context, advisorName string) (models.AnalyticsSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	assignedClientCount := 8
	totalClientCount := 20
	usage := []models.WidgetUsage{
		{WidgetID: "two-pot-impact", WidgetName: "Two-Pot Impact", AssignedCount: 6, PublishedCount: 4, SimulationCount: 15},
		{WidgetID: "income-sustainability", WidgetName: "Income Sustainability", AssignedCount: 4, PublishedCount: 3, SimulationCount: 9},
		{WidgetID: "onefee-wealth-reclaim", WidgetName: "Onefee Wealth Reclaim", AssignedCount: 3, PublishedCount: 2, SimulationCount: 6},
	}

	return models.AnalyticsSummary{
		TotalUsers:          1,
		TotalClients:        assignedClientCount,
		TotalWidgets:        3,
		TotalSimulations:    totalSimulations(usage),
		ClientEngagement:    clientEngagementPercentage(assignedClientCount, totalClientCount),
		PublishedDashboards: 4,
		MostUsedWidget:      mostUsedWidget(usage),
		WidgetUsage:         usage,
	}, nil
}

func (r *mockAnalyticsRepository) GetWidgetUsage(ctx context.Context) ([]models.WidgetUsage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return append([]models.WidgetUsage(nil), r.widgetUsage...), nil
}

func (r *mockAnalyticsRepository) ListNotifications(ctx context.Context) ([]models.Notification, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return append([]models.Notification(nil), r.notifications...), nil
}

func (r *mockAnalyticsRepository) MarkNotificationRead(ctx context.Context, id string) (models.Notification, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for index := range r.notifications {
		if r.notifications[index].ID == id {
			r.notifications[index].Read = true
			return r.notifications[index], nil
		}
	}
	return models.Notification{}, ErrNotificationNotFound
}

func (r *mockAnalyticsRepository) ListAuditLogs(ctx context.Context, page, pageSize int) ([]models.AuditLog, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	logs := append([]models.AuditLog(nil), r.auditLogs...)
	pagedLogs, _ := paginateSlice(logs, page, pageSize)
	return pagedLogs, len(logs), nil
}

func totalSimulations(usage []models.WidgetUsage) int {
	total := 0
	for _, item := range usage {
		total += item.SimulationCount
	}
	return total
}

func clientEngagementPercentage(assignedClientCount int, totalClientCount int) int {
	if totalClientCount <= 0 {
		return 0
	}
	return int(float64(assignedClientCount) / float64(totalClientCount) * 100)
}

func mostUsedWidget(usage []models.WidgetUsage) string {
	if len(usage) == 0 {
		return ""
	}
	top := usage[0]
	topScore := widgetUsageScore(top)
	for _, item := range usage[1:] {
		score := widgetUsageScore(item)
		if score > topScore {
			top = item
			topScore = score
		}
	}
	return top.WidgetName
}

func widgetUsageScore(item models.WidgetUsage) int {
	return item.SimulationCount + item.PublishedCount + item.AssignedCount
}
