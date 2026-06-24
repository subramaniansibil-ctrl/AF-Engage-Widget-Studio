package models

import "time"

type Notification struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

type AuditLog struct {
	ID        string    `json:"id"`
	Actor     string    `json:"actor"`
	Action    string    `json:"action"`
	Entity    string    `json:"entity"`
	CreatedAt time.Time `json:"createdAt"`
}

type WidgetUsage struct {
	WidgetID        string `json:"widgetId"`
	WidgetName      string `json:"widgetName"`
	AssignedCount   int    `json:"assignedCount"`
	PublishedCount  int    `json:"publishedCount"`
	SimulationCount int    `json:"simulationCount"`
}

type AnalyticsSummary struct {
	TotalUsers          int           `json:"totalUsers"`
	TotalClients        int           `json:"totalClients"`
	TotalWidgets        int           `json:"totalWidgets"`
	TotalSimulations    int           `json:"totalSimulations"`
	ClientEngagement    int           `json:"clientEngagement"`
	PublishedDashboards int           `json:"publishedDashboards"`
	MostUsedWidget      string        `json:"mostUsedWidget"`
	WidgetUsage         []WidgetUsage `json:"widgetUsage"`
}
