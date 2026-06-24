package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type postgresClientRepository struct {
	db *sql.DB
}

func NewPostgresClientRepository(db *sql.DB) ClientRepository {
	return &postgresClientRepository{db: db}
}

func (r *postgresClientRepository) ListRecommendations(ctx context.Context, clientID string) ([]models.ClientRecommendation, error) {
	return []models.ClientRecommendation{
		{ID: "recommendation-001", Title: "Keep savings pot withdrawals low", Description: "Preserving short-term savings can improve long-term retirement flexibility.", Priority: "High"},
		{ID: "recommendation-002", Title: "Review contribution increase", Description: "A small monthly increase may meaningfully improve projected readiness.", Priority: "Medium"},
		{ID: "recommendation-003", Title: "Complete income sustainability widget", Description: "Model retirement income against a balanced market scenario.", Priority: "Medium"},
	}, nil
}

func (r *postgresClientRepository) ListSimulations(ctx context.Context, clientID string) ([]models.Simulation, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, client_id, widget_id, inputs, result, created_at
		FROM simulation_history
		WHERE client_id = $1
		ORDER BY created_at DESC
	`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	simulations := []models.Simulation{}
	for rows.Next() {
		var simulation models.Simulation
		var inputsJSON []byte
		if err := rows.Scan(&simulation.ID, &simulation.ClientID, &simulation.WidgetID, &inputsJSON, &simulation.Result, &simulation.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(inputsJSON, &simulation.Inputs); err != nil {
			return nil, err
		}
		simulations = append(simulations, simulation)
	}
	return simulations, rows.Err()
}

func (r *postgresClientRepository) SaveSimulation(ctx context.Context, clientID string, request models.SimulationRequest) (models.Simulation, error) {
	if request.Inputs == nil {
		request.Inputs = map[string]string{}
	}
	if request.Result == "" {
		request.Result = "Simulation saved for advisor review."
	}
	inputsJSON, err := json.Marshal(request.Inputs)
	if err != nil {
		return models.Simulation{}, err
	}
	simulation := models.Simulation{
		ID:        fmt.Sprintf("simulation-%d", time.Now().UnixNano()),
		ClientID:  clientID,
		WidgetID:  request.WidgetID,
		Inputs:    request.Inputs,
		Result:    request.Result,
		CreatedAt: time.Now().UTC(),
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO simulation_history (id, client_id, widget_id, inputs, result, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, simulation.ID, simulation.ClientID, simulation.WidgetID, inputsJSON, simulation.Result, simulation.CreatedAt)
	return simulation, err
}
