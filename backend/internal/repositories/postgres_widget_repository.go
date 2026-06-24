package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

type postgresWidgetRepository struct {
	db *sql.DB
}

func NewPostgresWidgetRepository(db *sql.DB) WidgetRepository {
	return &postgresWidgetRepository{db: db}
}

func (r *postgresWidgetRepository) ListWidgets(ctx context.Context) ([]models.Widget, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, description, category, icon, status, default_configuration, to_json(required_data_points)
		FROM widgets
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	widgets := []models.Widget{}
	for rows.Next() {
		widget, err := scanWidget(rows)
		if err != nil {
			return nil, err
		}
		widgets = append(widgets, widget)
	}
	return widgets, rows.Err()
}

func (r *postgresWidgetRepository) GetWidgetByID(ctx context.Context, id string) (models.Widget, error) {
	widget, err := scanWidget(r.db.QueryRowContext(ctx, `
		SELECT id, name, description, category, icon, status, default_configuration, to_json(required_data_points)
		FROM widgets
		WHERE id = $1
	`, id))
	if err == sql.ErrNoRows {
		return models.Widget{}, ErrWidgetNotFound
	}
	return widget, err
}

func (r *postgresWidgetRepository) ConfigureWidget(ctx context.Context, clientID string, request models.ConfigureWidgetRequest) (models.WidgetConfiguration, error) {
	widget, err := r.GetWidgetByID(ctx, request.WidgetID)
	if err != nil {
		return models.WidgetConfiguration{}, err
	}
	options := copyOptions(widget.DefaultConfiguration.Options)
	for key, value := range request.Options {
		options[key] = value
	}
	optionsJSON, err := json.Marshal(options)
	if err != nil {
		return models.WidgetConfiguration{}, err
	}

	configuration := models.WidgetConfiguration{
		ID:       fmt.Sprintf("config-%d", time.Now().UnixNano()),
		WidgetID: request.WidgetID,
		ClientID: clientID,
		Options:  options,
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO widget_configurations (id, widget_id, client_id, options)
		VALUES ($1, $2, $3, $4)
	`, configuration.ID, configuration.WidgetID, configuration.ClientID, optionsJSON)
	return configuration, err
}

func (r *postgresWidgetRepository) AssignWidget(ctx context.Context, clientID string, request models.AssignWidgetRequest) (models.DashboardAssignment, error) {
	widget, err := r.GetWidgetByID(ctx, request.WidgetID)
	if err != nil {
		return models.DashboardAssignment{}, err
	}
	configurationID := request.ConfigurationID
	if configurationID == "" {
		config, err := r.ConfigureWidget(ctx, clientID, models.ConfigureWidgetRequest{WidgetID: request.WidgetID})
		if err != nil {
			return models.DashboardAssignment{}, err
		}
		configurationID = config.ID
	}
	configuration, err := r.getConfiguration(ctx, configurationID)
	if err == sql.ErrNoRows || configuration.ClientID != clientID || configuration.WidgetID != request.WidgetID {
		return models.DashboardAssignment{}, ErrConfigurationNotFound
	}
	if err != nil {
		return models.DashboardAssignment{}, err
	}

	assignment := models.DashboardAssignment{
		ID:            fmt.Sprintf("assignment-%d", time.Now().UnixNano()),
		ClientID:      clientID,
		WidgetID:      widget.ID,
		WidgetName:    widget.Name,
		Configuration: configuration,
		Published:     false,
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO dashboard_assignments (id, client_id, widget_id, configuration_id, published)
		VALUES ($1, $2, $3, $4, $5)
	`, assignment.ID, assignment.ClientID, assignment.WidgetID, assignment.Configuration.ID, assignment.Published)
	return assignment, err
}

func (r *postgresWidgetRepository) ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT da.id, da.client_id, da.widget_id, w.name, da.published,
			wc.id, wc.widget_id, wc.client_id, wc.options
		FROM dashboard_assignments da
		JOIN widgets w ON w.id = da.widget_id
		JOIN widget_configurations wc ON wc.id = da.configuration_id
		WHERE da.client_id = $1
		ORDER BY da.created_at, w.name
	`, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	assignments := []models.DashboardAssignment{}
	for rows.Next() {
		assignment, err := scanAssignment(rows)
		if err != nil {
			return nil, err
		}
		assignments = append(assignments, assignment)
	}
	return assignments, rows.Err()
}

func (r *postgresWidgetRepository) PublishDashboard(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	if _, err := r.db.ExecContext(ctx, `UPDATE dashboard_assignments SET published = TRUE WHERE client_id = $1`, clientID); err != nil {
		return nil, err
	}
	return r.ListAssignedWidgets(ctx, clientID)
}

func (r *postgresWidgetRepository) getConfiguration(ctx context.Context, id string) (models.WidgetConfiguration, error) {
	var config models.WidgetConfiguration
	var optionsJSON []byte
	err := r.db.QueryRowContext(ctx, `
		SELECT id, widget_id, client_id, options
		FROM widget_configurations
		WHERE id = $1
	`, id).Scan(&config.ID, &config.WidgetID, &config.ClientID, &optionsJSON)
	if err != nil {
		return models.WidgetConfiguration{}, err
	}
	if err := json.Unmarshal(optionsJSON, &config.Options); err != nil {
		return models.WidgetConfiguration{}, err
	}
	return config, nil
}

func scanWidget(row scanner) (models.Widget, error) {
	var widget models.Widget
	var defaultConfigJSON []byte
	var requiredDataPointsJSON []byte
	err := row.Scan(&widget.ID, &widget.Name, &widget.Description, &widget.Category, &widget.Icon, &widget.Status, &defaultConfigJSON, &requiredDataPointsJSON)
	if err != nil {
		return models.Widget{}, err
	}
	widget.DefaultConfiguration = models.WidgetConfiguration{ID: "default-" + widget.ID, WidgetID: widget.ID, Options: map[string]string{}}
	if len(defaultConfigJSON) > 0 {
		if err := json.Unmarshal(defaultConfigJSON, &widget.DefaultConfiguration.Options); err != nil {
			return models.Widget{}, err
		}
	}
	if len(requiredDataPointsJSON) > 0 {
		if err := json.Unmarshal(requiredDataPointsJSON, &widget.RequiredDataPoints); err != nil {
			return models.Widget{}, err
		}
	}
	return widget, nil
}

func scanAssignment(row scanner) (models.DashboardAssignment, error) {
	var assignment models.DashboardAssignment
	var optionsJSON []byte
	err := row.Scan(
		&assignment.ID,
		&assignment.ClientID,
		&assignment.WidgetID,
		&assignment.WidgetName,
		&assignment.Published,
		&assignment.Configuration.ID,
		&assignment.Configuration.WidgetID,
		&assignment.Configuration.ClientID,
		&optionsJSON,
	)
	if err != nil {
		return models.DashboardAssignment{}, err
	}
	if err := json.Unmarshal(optionsJSON, &assignment.Configuration.Options); err != nil {
		return models.DashboardAssignment{}, err
	}
	return assignment, nil
}
