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

func (r *postgresClientRepository) ListSimulations(ctx context.Context, clientID string, widgetID string) ([]models.Simulation, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, client_id, widget_id, name, widget_name, inputs, results, result, saved_by_id, saved_by_name, saved_by_role, created_at, updated_at
		FROM simulation_history
		WHERE client_id = $1 AND ($2 = '' OR widget_id = $2)
		ORDER BY updated_at DESC
	`, clientID, widgetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	simulations := []models.Simulation{}
	for rows.Next() {
		var simulation models.Simulation
		var inputsJSON, resultsJSON []byte
		if err := rows.Scan(&simulation.ID, &simulation.ClientID, &simulation.WidgetID, &simulation.Name, &simulation.WidgetName, &inputsJSON, &resultsJSON, &simulation.Result, &simulation.SavedByID, &simulation.SavedByName, &simulation.SavedByRole, &simulation.CreatedAt, &simulation.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(inputsJSON, &simulation.Inputs); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(resultsJSON, &simulation.Results); err != nil {
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
	if request.SavedByName == "" {
		request.SavedByName = "Client"
	}
	if request.SavedByRole == "" {
		request.SavedByRole = models.RoleClient
	}
	inputsJSON, err := json.Marshal(request.Inputs)
	if err != nil {
		return models.Simulation{}, err
	}
	resultsJSON, err := json.Marshal(request.Results)
	if err != nil {
		return models.Simulation{}, err
	}
	now := time.Now().UTC()
	simulation := models.Simulation{
		ID:         fmt.Sprintf("simulation-%d", time.Now().UnixNano()),
		ClientID:   clientID,
		WidgetID:   request.WidgetID,
		Name:       request.Name,
		WidgetName: request.WidgetName,
		Inputs:     request.Inputs,
		Results:    request.Results,
		Result:     request.Result,
		SavedByID:  request.SavedByID,
		SavedByName: request.SavedByName,
		SavedByRole: request.SavedByRole,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO simulation_history (id, client_id, widget_id, name, widget_name, inputs, results, result, saved_by_id, saved_by_name, saved_by_role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, simulation.ID, simulation.ClientID, simulation.WidgetID, simulation.Name, simulation.WidgetName, inputsJSON, resultsJSON, simulation.Result, simulation.SavedByID, simulation.SavedByName, simulation.SavedByRole, simulation.CreatedAt, simulation.UpdatedAt)
	return simulation, err
}

func (r *postgresClientRepository) UpdateSimulation(ctx context.Context, clientID string, simulationID string, request models.SimulationUpdateRequest) (models.Simulation, error) {
	inputsJSON, err := json.Marshal(request.Inputs)
	if err != nil {
		return models.Simulation{}, err
	}
	resultsJSON, err := json.Marshal(request.Results)
	if err != nil {
		return models.Simulation{}, err
	}
	result, err := r.db.ExecContext(ctx, `UPDATE simulation_history SET name=$3, inputs=$4, results=$5, result=$6, updated_at=NOW() WHERE id=$1 AND client_id=$2`, simulationID, clientID, request.Name, inputsJSON, resultsJSON, request.Result)
	if err != nil {
		return models.Simulation{}, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return models.Simulation{}, err
	}
	if rows == 0 {
		return models.Simulation{}, ErrSimulationNotFound
	}
	return r.getSimulation(ctx, clientID, simulationID)
}

func (r *postgresClientRepository) DuplicateSimulation(ctx context.Context, clientID string, simulationID string, name string, saver models.User) (models.Simulation, error) {
	existing, err := r.getSimulation(ctx, clientID, simulationID)
	if err != nil {
		return models.Simulation{}, err
	}
	if name == "" {
		name = existing.Name + " Copy"
	}
	return r.SaveSimulation(ctx, clientID, models.SimulationRequest{Name: name, WidgetID: existing.WidgetID, WidgetName: existing.WidgetName, Inputs: existing.Inputs, Results: existing.Results, Result: existing.Result, SavedByID: saver.ID, SavedByName: saver.Name, SavedByRole: saver.Role})
}

func (r *postgresClientRepository) DeleteSimulation(ctx context.Context, clientID string, simulationID string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM simulation_history WHERE id=$1 AND client_id=$2`, simulationID, clientID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrSimulationNotFound
	}
	return nil
}

func (r *postgresClientRepository) getSimulation(ctx context.Context, clientID string, simulationID string) (models.Simulation, error) {
	var simulation models.Simulation
	var inputsJSON, resultsJSON []byte
	err := r.db.QueryRowContext(ctx, `SELECT id, client_id, widget_id, name, widget_name, inputs, results, result, saved_by_id, saved_by_name, saved_by_role, created_at, updated_at FROM simulation_history WHERE id=$1 AND client_id=$2`, simulationID, clientID).Scan(&simulation.ID, &simulation.ClientID, &simulation.WidgetID, &simulation.Name, &simulation.WidgetName, &inputsJSON, &resultsJSON, &simulation.Result, &simulation.SavedByID, &simulation.SavedByName, &simulation.SavedByRole, &simulation.CreatedAt, &simulation.UpdatedAt)
	if err == sql.ErrNoRows {
		return models.Simulation{}, ErrSimulationNotFound
	}
	if err != nil {
		return models.Simulation{}, err
	}
	if err := json.Unmarshal(inputsJSON, &simulation.Inputs); err != nil {
		return models.Simulation{}, err
	}
	if err := json.Unmarshal(resultsJSON, &simulation.Results); err != nil {
		return models.Simulation{}, err
	}
	return simulation, nil
}
