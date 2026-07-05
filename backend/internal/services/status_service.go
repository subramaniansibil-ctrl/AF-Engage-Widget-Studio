package services

import (
	"context"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

type StatusService interface {
	Health(ctx context.Context) (models.HealthResponse, error)
	Status(ctx context.Context) (models.APIStatus, error)
}

type statusService struct {
	repository repositories.StatusRepository
}

func NewStatusService(repository repositories.StatusRepository) StatusService {
	return &statusService{repository: repository}
}

func (s *statusService) Health(ctx context.Context) (models.HealthResponse, error) {
	return s.repository.Health(ctx)
}

func (s *statusService) Status(ctx context.Context) (models.APIStatus, error) {
	return s.repository.Status(ctx)
}
