package models

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
	ID            string              `json:"id"`
	ClientID      string              `json:"clientId"`
	WidgetID      string              `json:"widgetId"`
	WidgetName    string              `json:"widgetName"`
	Configuration WidgetConfiguration `json:"configuration"`
	Published     bool                `json:"published"`
}

type ConfigureWidgetRequest struct {
	WidgetID string            `json:"widgetId" binding:"required"`
	Options  map[string]string `json:"options"`
}

type AssignWidgetRequest struct {
	WidgetID        string `json:"widgetId" binding:"required"`
	ConfigurationID string `json:"configurationId"`
}
