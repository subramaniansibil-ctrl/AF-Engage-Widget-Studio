package repositories

import (
	"context"
	"time"

	"github.com/af-engage-widget-studio/backend/internal/config"
	"github.com/af-engage-widget-studio/backend/internal/models"
)

type StatusRepository interface {
	Health(ctx context.Context) (models.HealthResponse, error)
	Status(ctx context.Context) (models.APIStatus, error)
}

type statusRepository struct {
	cfg config.Config
}

func NewStatusRepository(cfg config.Config) StatusRepository {
	return &statusRepository{cfg: cfg}
}

func (r *statusRepository) Health(ctx context.Context) (models.HealthResponse, error) {
	return models.HealthResponse{
		Success: true,
		Status:  "ok",
		Service: r.cfg.ServiceName,
	}, nil
}

func (r *statusRepository) Status(ctx context.Context) (models.APIStatus, error) {
	return models.APIStatus{
		Service:     r.cfg.ServiceName,
		Environment: r.cfg.Environment,
		Version:     "v1",
		Timestamp:   time.Now().UTC(),
	}, nil
}
