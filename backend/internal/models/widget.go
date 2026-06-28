package models

import "time"

type WidgetStatus string

const (
	WidgetStatusActive WidgetStatus = "ACTIVE"
	WidgetStatusDraft  WidgetStatus = "DRAFT"
)

type Widget struct {
	ID                   string              `json:"id"`
	Name                 string              `json:"name"`
	Description          string              `json:"description"`
	Category             string              `json:"category"`
	Icon                 string              `json:"icon"`
	Status               WidgetStatus        `json:"status"`
	DefaultConfiguration WidgetConfiguration `json:"defaultConfiguration"`
	RequiredDataPoints   []string            `json:"requiredDataPoints"`
}

type WidgetConfiguration struct {
	ID       string            `json:"id"`
	WidgetID string            `json:"widgetId"`
	ClientID string            `json:"clientId"`
	Options  map[string]string `json:"options"`
}

type DashboardAssignment struct {
	ID                string              `json:"id"`
	ClientID          string              `json:"clientId"`
	WidgetID          string              `json:"widgetId"`
	WidgetName        string              `json:"widgetName"`
	WidgetDescription string              `json:"widgetDescription"`
	WidgetCategory    string              `json:"widgetCategory"`
	WidgetIcon        string              `json:"widgetIcon"`
	Configuration     WidgetConfiguration `json:"configuration"`
	Published         bool                `json:"published"`
	CreatedAt         time.Time           `json:"createdAt"`
	UpdatedAt         time.Time           `json:"updatedAt"`
}

type ConfigureWidgetRequest struct {
	WidgetID string            `json:"widgetId" binding:"required"`
	Options  map[string]string `json:"options"`
}

type AssignWidgetRequest struct {
	WidgetID        string `json:"widgetId" binding:"required"`
	ConfigurationID string `json:"configurationId"`
}

type UpdateAssignedWidgetRequest struct {
	Options map[string]string `json:"options" binding:"required"`
}
