package services

import (
	"context"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

type WidgetService interface {
	ListWidgets(ctx context.Context) ([]models.Widget, error)
	GetWidgetByID(ctx context.Context, id string) (models.Widget, error)
	ConfigureWidget(ctx context.Context, clientID string, request models.ConfigureWidgetRequest) (models.WidgetConfiguration, error)
	AssignWidget(ctx context.Context, clientID string, request models.AssignWidgetRequest) (models.DashboardAssignment, error)
	ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
	UpdateAssignedWidget(ctx context.Context, clientID string, assignmentID string, request models.UpdateAssignedWidgetRequest) (models.DashboardAssignment, error)
	RemoveAssignedWidget(ctx context.Context, clientID string, assignmentID string) error
	PublishDashboard(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
}

type widgetService struct {
	repository repositories.WidgetRepository
}

func NewWidgetService(repository repositories.WidgetRepository) WidgetService {
	return &widgetService{repository: repository}
}

func (s *widgetService) ListWidgets(ctx context.Context) ([]models.Widget, error) {
	return s.repository.ListWidgets(ctx)
}

func (s *widgetService) GetWidgetByID(ctx context.Context, id string) (models.Widget, error) {
	return s.repository.GetWidgetByID(ctx, id)
}

func (s *widgetService) ConfigureWidget(ctx context.Context, clientID string, request models.ConfigureWidgetRequest) (models.WidgetConfiguration, error) {
	return s.repository.ConfigureWidget(ctx, clientID, request)
}

func (s *widgetService) AssignWidget(ctx context.Context, clientID string, request models.AssignWidgetRequest) (models.DashboardAssignment, error) {
	return s.repository.AssignWidget(ctx, clientID, request)
}

func (s *widgetService) ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	return s.repository.ListAssignedWidgets(ctx, clientID)
}

func (s *widgetService) UpdateAssignedWidget(ctx context.Context, clientID string, assignmentID string, request models.UpdateAssignedWidgetRequest) (models.DashboardAssignment, error) {
	return s.repository.UpdateAssignedWidget(ctx, clientID, assignmentID, request)
}

func (s *widgetService) RemoveAssignedWidget(ctx context.Context, clientID string, assignmentID string) error {
	return s.repository.RemoveAssignedWidget(ctx, clientID, assignmentID)
}

func (s *widgetService) PublishDashboard(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	return s.repository.PublishDashboard(ctx, clientID)
}
