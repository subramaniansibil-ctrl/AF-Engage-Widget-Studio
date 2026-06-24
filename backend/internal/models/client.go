package models

import "time"

type ClientRecommendation struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

type SimulationRequest struct {
	WidgetID string            `json:"widgetId" binding:"required"`
	Inputs   map[string]string `json:"inputs"`
	Result   string            `json:"result"`
}

type Simulation struct {
	ID        string            `json:"id"`
	ClientID  string            `json:"clientId"`
	WidgetID  string            `json:"widgetId"`
	Inputs    map[string]string `json:"inputs"`
	Result    string            `json:"result"`
	CreatedAt time.Time         `json:"createdAt"`
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
