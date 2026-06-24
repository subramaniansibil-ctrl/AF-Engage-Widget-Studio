package repositories

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type ClientRepository interface {
	ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error)
	ListSimulations(ctx context.Context, clientID string) ([]models.Simulation, error)
	SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error)
}

type mockClientRepository struct {
	mu          sync.RWMutex
	simulations map[string][]models.Simulation
	nextID      int
}

func NewMockClientRepository() ClientRepository {
	return &mockClientRepository{
		simulations: map[string][]models.Simulation{
			"client-001": {
				{
					ID:       "simulation-001",
					ClientID: "client-001",
					WidgetID: "two-pot-impact",
					Inputs: map[string]string{
						"projectionYears": "20",
						"scenario":        "No withdrawal",
					},
					Result:    "Retirement goal remains on track at the current contribution rate.",
					CreatedAt: time.Now().Add(-48 * time.Hour).UTC(),
				},
			},
		},
		nextID: 2,
	}
}

func (r *mockClientRepository) ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error) {
	return []models.ClientRecommendation{
		{
			ID:          "recommendation-001",
			Title:       "Keep savings pot withdrawals low",
			Description: "Preserving short-term savings can improve long-term retirement flexibility.",
			Priority:    "High",
		},
		{
			ID:          "recommendation-002",
			Title:       "Review contribution increase",
			Description: "A small monthly increase may meaningfully improve projected readiness.",
			Priority:    "Medium",
		},
		{
			ID:          "recommendation-003",
			Title:       "Complete income sustainability widget",
			Description: "Model retirement income against a balanced market scenario.",
			Priority:    "Medium",
		},
	}, nil
}

func (r *mockClientRepository) ListSimulations(ctx context.Context, clientID string) ([]models.Simulation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	simulations := r.simulations[clientID]
	if simulations == nil {
		return []models.Simulation{}, nil
	}

	return append([]models.Simulation(nil), simulations...), nil
}

func (r *mockClientRepository) SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	simulation := models.Simulation{
		ID:        fmt.Sprintf("simulation-%03d", r.nextID),
		ClientID:  clientID,
		WidgetID:  request.WidgetID,
		Inputs:    request.Inputs,
		Result:    request.Result,
		CreatedAt: time.Now().UTC(),
	}
	if simulation.Inputs == nil {
		simulation.Inputs = map[string]string{}
	}
	if simulation.Result == "" {
		simulation.Result = "Simulation saved for advisor review."
	}

	r.nextID++
	r.simulations[clientID] = append([]models.Simulation{simulation}, r.simulations[clientID]...)

	return simulation, nil
}
