package services

import (
	"context"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

type AdvisorService interface {
	GetDashboardStats(ctx context.Context, advisorName string) (models.AdvisorDashboardStats, error)
	ListClients(ctx context.Context, filters repositories.ClientFilters) ([]models.Client, int, error)
	GetClientByID(ctx context.Context, id string) (models.Client, error)
}

type advisorService struct {
	repository repositories.AdvisorRepository
}

func NewAdvisorService(repository repositories.AdvisorRepository) AdvisorService {
	return &advisorService{repository: repository}
}

func (s *advisorService) GetDashboardStats(ctx context.Context, advisorName string) (models.AdvisorDashboardStats, error) {
	return s.repository.GetDashboardStats(ctx, advisorName)
}

func (s *advisorService) ListClients(ctx context.Context, filters repositories.ClientFilters) ([]models.Client, int, error) {
	return s.repository.ListClients(ctx, filters)
}

func (s *advisorService) GetClientByID(ctx context.Context, id string) (models.Client, error) {
	return s.repository.GetClientByID(ctx, id)
}
