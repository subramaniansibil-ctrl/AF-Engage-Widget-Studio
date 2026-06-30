package repositories

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var ErrSimulationNotFound = errors.New("simulation not found")

type ClientRepository interface {
	ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error)
	ListSimulations(ctx context.Context, clientID string, widgetID string) ([]models.Simulation, error)
	SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error)
	UpdateSimulation(ctx context.Context, clientID string, simulationID string, request models.SimulationUpdateRequest) (models.Simulation, error)
	DuplicateSimulation(ctx context.Context, clientID string, simulationID string, name string, saver models.User) (models.Simulation, error)
	DeleteSimulation(ctx context.Context, clientID string, simulationID string) error
}

type mockClientRepository struct {
	mu          sync.RWMutex
	simulations map[string][]models.Simulation
	nextID      int
}

func NewMockClientRepository() ClientRepository {
	createdAt := time.Now().Add(-48 * time.Hour).UTC()
	return &mockClientRepository{
		simulations: map[string][]models.Simulation{
			"client-001": {{
				ID: "simulation-001", ClientID: "client-001", WidgetID: "two-pot-impact",
				Name: "Current retirement plan", WidgetName: "Two-Pot Impact",
				Inputs:    map[string]string{"projectionYears": "20", "scenario": "No withdrawal"},
				Results:   map[string]string{"projectedRetirementValue": "$1,420,000"},
				Result:    "Retirement goal remains on track at the current contribution rate.",
				SavedByID: "client-001", SavedByName: "Avery Chen", SavedByRole: models.RoleClient,
				CreatedAt: createdAt, UpdatedAt: createdAt,
			}},
		},
		nextID: 2,
	}
}

func (r *mockClientRepository) ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error) {
	return []models.ClientRecommendation{
		{ID: "recommendation-001", Title: "Keep savings pot withdrawals low", Description: "Preserving short-term savings can improve long-term retirement flexibility.", Priority: "High"},
		{ID: "recommendation-002", Title: "Review contribution increase", Description: "A small monthly increase may meaningfully improve projected readiness.", Priority: "Medium"},
		{ID: "recommendation-003", Title: "Complete income sustainability widget", Description: "Model retirement income against a balanced market scenario.", Priority: "Medium"},
	}, nil
}

func (r *mockClientRepository) ListSimulations(ctx context.Context, clientID string, widgetID string) ([]models.Simulation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	filtered := []models.Simulation{}
	for _, simulation := range r.simulations[clientID] {
		if widgetID == "" || simulation.WidgetID == widgetID {
			filtered = append(filtered, simulation)
		}
	}
	return filtered, nil
}

func (r *mockClientRepository) SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	simulation := models.Simulation{
		ID: fmt.Sprintf("simulation-%03d", r.nextID), ClientID: clientID, WidgetID: request.WidgetID,
		Name: request.Name, WidgetName: request.WidgetName, Inputs: request.Inputs, Results: request.Results,
		Result: request.Result, SavedByID: request.SavedByID, SavedByName: request.SavedByName, SavedByRole: request.SavedByRole, CreatedAt: now, UpdatedAt: now,
	}
	normalizeSimulation(&simulation)
	r.nextID++
	r.simulations[clientID] = append([]models.Simulation{simulation}, r.simulations[clientID]...)
	return simulation, nil
}

func (r *mockClientRepository) UpdateSimulation(ctx context.Context, clientID string, simulationID string, request models.SimulationUpdateRequest) (models.Simulation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for index, simulation := range r.simulations[clientID] {
		if simulation.ID != simulationID {
			continue
		}
		simulation.Name, simulation.Inputs, simulation.Results, simulation.Result = request.Name, request.Inputs, request.Results, request.Result
		simulation.UpdatedAt = time.Now().UTC()
		normalizeSimulation(&simulation)
		r.simulations[clientID][index] = simulation
		return simulation, nil
	}
	return models.Simulation{}, ErrSimulationNotFound
}

func (r *mockClientRepository) DuplicateSimulation(ctx context.Context, clientID string, simulationID string, name string, saver models.User) (models.Simulation, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, existing := range r.simulations[clientID] {
		if existing.ID != simulationID {
			continue
		}
		now := time.Now().UTC()
		duplicate := existing
		duplicate.ID = fmt.Sprintf("simulation-%03d", r.nextID)
		duplicate.Name = name
		if duplicate.Name == "" {
			duplicate.Name = existing.Name + " Copy"
		}
		duplicate.Inputs, duplicate.Results = copyStringMap(existing.Inputs), copyStringMap(existing.Results)
		duplicate.CreatedAt, duplicate.UpdatedAt = now, now
		duplicate.SavedByID, duplicate.SavedByName, duplicate.SavedByRole = saver.ID, saver.Name, saver.Role
		normalizeSimulation(&duplicate)
		r.nextID++
		r.simulations[clientID] = append([]models.Simulation{duplicate}, r.simulations[clientID]...)
		return duplicate, nil
	}
	return models.Simulation{}, ErrSimulationNotFound
}

func (r *mockClientRepository) DeleteSimulation(ctx context.Context, clientID string, simulationID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for index, simulation := range r.simulations[clientID] {
		if simulation.ID == simulationID {
			r.simulations[clientID] = append(r.simulations[clientID][:index], r.simulations[clientID][index+1:]...)
			return nil
		}
	}
	return ErrSimulationNotFound
}

func normalizeSimulation(simulation *models.Simulation) {
	if simulation.Inputs == nil {
		simulation.Inputs = map[string]string{}
	}
	if simulation.Results == nil {
		simulation.Results = map[string]string{}
	}
	if simulation.Result == "" {
		simulation.Result = "Simulation saved for future comparison."
	}
	if simulation.SavedByName == "" {
		simulation.SavedByName = "Client"
	}
	if simulation.SavedByRole == "" {
		simulation.SavedByRole = models.RoleClient
	}
}

func copyStringMap(source map[string]string) map[string]string {
	copied := make(map[string]string, len(source))
	for key, value := range source {
		copied[key] = value
	}
	return copied
}
