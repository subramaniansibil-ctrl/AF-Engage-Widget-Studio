package services

import (
	"context"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

type AnalyticsService interface {
	GetAdminAnalytics(ctx context.Context) (models.AnalyticsSummary, error)
	GetAdvisorAnalytics(ctx context.Context, advisorName string) (models.AnalyticsSummary, error)
	GetWidgetUsage(ctx context.Context) ([]models.WidgetUsage, error)
	ListNotifications(ctx context.Context) ([]models.Notification, error)
	MarkNotificationRead(ctx context.Context, id string) (models.Notification, error)
	ListAuditLogs(ctx context.Context, page, pageSize int) ([]models.AuditLog, int, error)
}

type analyticsService struct {
	repository repositories.AnalyticsRepository
}

func NewAnalyticsService(repository repositories.AnalyticsRepository) AnalyticsService {
	return &analyticsService{repository: repository}
}

func (s *analyticsService) GetAdminAnalytics(ctx context.Context) (models.AnalyticsSummary, error) {
	return s.repository.GetAdminAnalytics(ctx)
}

func (s *analyticsService) GetAdvisorAnalytics(ctx context.Context, advisorName string) (models.AnalyticsSummary, error) {
	return s.repository.GetAdvisorAnalytics(ctx, advisorName)
}

func (s *analyticsService) GetWidgetUsage(ctx context.Context) ([]models.WidgetUsage, error) {
	return s.repository.GetWidgetUsage(ctx)
}

func (s *analyticsService) ListNotifications(ctx context.Context) ([]models.Notification, error) {
	return s.repository.ListNotifications(ctx)
}

func (s *analyticsService) MarkNotificationRead(ctx context.Context, id string) (models.Notification, error) {
	return s.repository.MarkNotificationRead(ctx, id)
}

func (s *analyticsService) ListAuditLogs(ctx context.Context, page, pageSize int) ([]models.AuditLog, int, error) {
	return s.repository.ListAuditLogs(ctx, page, pageSize)
}
