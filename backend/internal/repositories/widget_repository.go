package repositories

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
)

var (
	ErrWidgetNotFound        = errors.New("widget not found")
	ErrConfigurationNotFound = errors.New("widget configuration not found")
)

type WidgetRepository interface {
	ListWidgets(ctx context.Context) ([]models.Widget, error)
	GetWidgetByID(ctx context.Context, id string) (models.Widget, error)
	ConfigureWidget(ctx context.Context, clientID string, request models.ConfigureWidgetRequest) (models.WidgetConfiguration, error)
	AssignWidget(ctx context.Context, clientID string, request models.AssignWidgetRequest) (models.DashboardAssignment, error)
	ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
	PublishDashboard(ctx context.Context, clientID string) ([]models.DashboardAssignment, error)
}

type mockWidgetRepository struct {
	mu             sync.RWMutex
	widgets        []models.Widget
	configurations map[string]models.WidgetConfiguration
	assignments    map[string][]models.DashboardAssignment
	nextConfigID   int
	nextAssignID   int
}

func NewMockWidgetRepository() WidgetRepository {
	widgets := mockWidgets()
	twoPotConfig := models.WidgetConfiguration{
		ID:       "config-seeded-001",
		WidgetID: "two-pot-impact",
		ClientID: "client-001",
		Options: map[string]string{
			"projectionYears": "20",
			"scenario":        "No withdrawal",
			"advisorNote":     "Review the long-term impact before accessing the savings pot.",
		},
	}
	incomeConfig := models.WidgetConfiguration{
		ID:       "config-seeded-002",
		WidgetID: "income-sustainability",
		ClientID: "client-001",
		Options: map[string]string{
			"projectionYears": "30",
			"scenario":        "Balanced market",
			"advisorNote":     "Use this to stress-test retirement income assumptions.",
		},
	}

	return &mockWidgetRepository{
		widgets: widgets,
		configurations: map[string]models.WidgetConfiguration{
			twoPotConfig.ID: twoPotConfig,
			incomeConfig.ID: incomeConfig,
		},
		assignments: map[string][]models.DashboardAssignment{
			"client-001": {
				{
					ID:            "assignment-seeded-001",
					ClientID:      "client-001",
					WidgetID:      "two-pot-impact",
					WidgetName:    "Two-Pot Impact",
					Configuration: twoPotConfig,
					Published:     true,
				},
				{
					ID:            "assignment-seeded-002",
					ClientID:      "client-001",
					WidgetID:      "income-sustainability",
					WidgetName:    "Income Sustainability",
					Configuration: incomeConfig,
					Published:     true,
				},
			},
		},
		nextConfigID: 3,
		nextAssignID: 3,
	}
}

func (r *mockWidgetRepository) ListWidgets(ctx context.Context) ([]models.Widget, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return append([]models.Widget(nil), r.widgets...), nil
}

func (r *mockWidgetRepository) GetWidgetByID(ctx context.Context, id string) (models.Widget, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.getWidgetByID(id)
}

func (r *mockWidgetRepository) ConfigureWidget(ctx context.Context, clientID string, request models.ConfigureWidgetRequest) (models.WidgetConfiguration, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	widget, err := r.getWidgetByID(request.WidgetID)
	if err != nil {
		return models.WidgetConfiguration{}, err
	}

	options := copyOptions(widget.DefaultConfiguration.Options)
	for key, value := range request.Options {
		options[key] = value
	}

	configuration := models.WidgetConfiguration{
		ID:       fmt.Sprintf("config-%03d", r.nextConfigID),
		WidgetID: request.WidgetID,
		ClientID: clientID,
		Options:  options,
	}
	r.nextConfigID++
	r.configurations[configuration.ID] = configuration

	return configuration, nil
}

func (r *mockWidgetRepository) AssignWidget(ctx context.Context, clientID string, request models.AssignWidgetRequest) (models.DashboardAssignment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	widget, err := r.getWidgetByID(request.WidgetID)
	if err != nil {
		return models.DashboardAssignment{}, err
	}

	configuration, ok := r.configurations[request.ConfigurationID]
	if request.ConfigurationID == "" || !ok {
		configuration = models.WidgetConfiguration{
			ID:       fmt.Sprintf("config-%03d", r.nextConfigID),
			WidgetID: widget.ID,
			ClientID: clientID,
			Options:  copyOptions(widget.DefaultConfiguration.Options),
		}
		r.nextConfigID++
		r.configurations[configuration.ID] = configuration
	} else if configuration.ClientID != clientID || configuration.WidgetID != widget.ID {
		return models.DashboardAssignment{}, ErrConfigurationNotFound
	}

	assignment := models.DashboardAssignment{
		ID:            fmt.Sprintf("assignment-%03d", r.nextAssignID),
		ClientID:      clientID,
		WidgetID:      widget.ID,
		WidgetName:    widget.Name,
		Configuration: configuration,
		Published:     false,
	}
	r.nextAssignID++
	r.assignments[clientID] = append(r.assignments[clientID], assignment)

	return assignment, nil
}

func (r *mockWidgetRepository) ListAssignedWidgets(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	assignments := r.assignments[clientID]
	if assignments == nil {
		return []models.DashboardAssignment{}, nil
	}

	return append([]models.DashboardAssignment(nil), assignments...), nil
}

func (r *mockWidgetRepository) PublishDashboard(ctx context.Context, clientID string) ([]models.DashboardAssignment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	assignments := r.assignments[clientID]
	if assignments == nil {
		return []models.DashboardAssignment{}, nil
	}

	for index := range assignments {
		assignments[index].Published = true
	}
	r.assignments[clientID] = assignments

	return append([]models.DashboardAssignment(nil), assignments...), nil
}

func (r *mockWidgetRepository) getWidgetByID(id string) (models.Widget, error) {
	for _, widget := range r.widgets {
		if widget.ID == id {
			return widget, nil
		}
	}
	return models.Widget{}, ErrWidgetNotFound
}

func copyOptions(options map[string]string) map[string]string {
	copied := make(map[string]string, len(options))
	for key, value := range options {
		copied[key] = value
	}
	return copied
}

func mockWidgets() []models.Widget {
	return []models.Widget{
		{
			ID:          "two-pot-impact",
			Name:        "Two-Pot Impact",
			Description: "Shows how savings-pot withdrawals can affect long-term retirement outcomes.",
			Category:    "Retirement planning",
			Icon:        "Scale",
			Status:      models.WidgetStatusActive,
			DefaultConfiguration: models.WidgetConfiguration{
				ID:       "default-two-pot-impact",
				WidgetID: "two-pot-impact",
				Options: map[string]string{
					"projectionYears":      "20",
					"withdrawalScenario":   "Moderate withdrawal",
					"includeTaxEstimate":   "true",
					"showEducationPrompts": "true",
				},
			},
			RequiredDataPoints: []string{"savingsPotBalance", "retirementPotBalance", "monthlyContribution", "retirementGoal"},
		},
		{
			ID:          "onefee-wealth-reclaim",
			Name:        "Onefee Wealth Reclaim",
			Description: "Illustrates fee drag and the compounding value of reclaiming unnecessary investment costs.",
			Category:    "Portfolio efficiency",
			Icon:        "RefreshCcw",
			Status:      models.WidgetStatusActive,
			DefaultConfiguration: models.WidgetConfiguration{
				ID:       "default-onefee-wealth-reclaim",
				WidgetID: "onefee-wealth-reclaim",
				Options: map[string]string{
					"feeComparison":       "1.25% vs 0.75%",
					"projectionYears":     "15",
					"showCostBreakdown":   "true",
					"includeAdvisorNotes": "true",
				},
			},
			RequiredDataPoints: []string{"portfolioValue", "investmentAllocation", "monthlyContribution"},
		},
		{
			ID:          "income-sustainability",
			Name:        "Income Sustainability",
			Description: "Models whether planned retirement income can remain sustainable across market conditions.",
			Category:    "Income planning",
			Icon:        "LineChart",
			Status:      models.WidgetStatusActive,
			DefaultConfiguration: models.WidgetConfiguration{
				ID:       "default-income-sustainability",
				WidgetID: "income-sustainability",
				Options: map[string]string{
					"monthlyIncomeTarget": "4500",
					"stressScenario":      "Balanced market",
					"projectionYears":     "30",
					"includeInflation":    "true",
				},
			},
			RequiredDataPoints: []string{"retirementPotBalance", "riskProfile", "retirementGoal", "investmentAllocation"},
		},
	}
}
