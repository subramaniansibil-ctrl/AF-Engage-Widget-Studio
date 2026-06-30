package models

import "time"

type ClientRecommendation struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

type SimulationRequest struct {
	Name       string            `json:"name" binding:"required,min=2,max=120"`
	WidgetID   string            `json:"widgetId" binding:"required"`
	WidgetName string            `json:"widgetName" binding:"required"`
	Inputs     map[string]string `json:"inputs"`
	Results    map[string]string `json:"results"`
	Result     string            `json:"result"`
	SavedByID   string           `json:"-"`
	SavedByName string           `json:"-"`
	SavedByRole Role             `json:"-"`
}

type SimulationUpdateRequest struct {
	Name    string            `json:"name" binding:"required,min=2,max=120"`
	Inputs  map[string]string `json:"inputs"`
	Results map[string]string `json:"results"`
	Result  string            `json:"result"`
}

type DuplicateSimulationRequest struct {
	Name string `json:"name" binding:"omitempty,min=2,max=120"`
}

type Simulation struct {
	ID         string            `json:"id"`
	ClientID   string            `json:"clientId"`
	WidgetID   string            `json:"widgetId"`
	Name       string            `json:"name"`
	WidgetName string            `json:"widgetName"`
	Inputs     map[string]string `json:"inputs"`
	Results    map[string]string `json:"results"`
	Result     string            `json:"result"`
	SavedByID   string           `json:"savedById,omitempty"`
	SavedByName string           `json:"savedByName"`
	SavedByRole Role             `json:"savedByRole"`
	CreatedAt  time.Time         `json:"createdAt"`
	UpdatedAt  time.Time         `json:"updatedAt"`
}

type ClientDashboardResponse struct {
	ClientProfile            Client                 `json:"clientProfile"`
	PortfolioSummary         Portfolio              `json:"portfolioSummary"`
	AssignedWidgets          []DashboardAssignment  `json:"assignedWidgets"`
	RetirementGoalProgress   RetirementGoal         `json:"retirementGoalProgress"`
	Recommendations          []ClientRecommendation `json:"recommendations"`
	LatestSimulations        []Simulation           `json:"latestSimulations"`
	RetirementReadinessScore int                    `json:"retirementReadinessScore"`
}
