package repositories

import (
	"testing"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

func TestWidgetUsageRowsToModelsPreservesIndependentCounts(t *testing.T) {
	rows := []widgetUsageRow{{
		WidgetID:        "widget-1",
		WidgetName:      "Two-Pot Impact",
		AssignedCount:   4,
		PublishedCount:  2,
		SimulationCount: 7,
	}}

	usage := widgetUsageRowsToModels(rows)
	if len(usage) != 1 {
		t.Fatalf("expected 1 widget usage item, got %d", len(usage))
	}
	if usage[0].AssignedCount != 4 {
		t.Fatalf("expected assigned count to be 4, got %d", usage[0].AssignedCount)
	}
	if usage[0].PublishedCount != 2 {
		t.Fatalf("expected published count to be 2, got %d", usage[0].PublishedCount)
	}
	if usage[0].SimulationCount != 7 {
		t.Fatalf("expected simulation count to be 7, got %d", usage[0].SimulationCount)
	}
}

func TestMostUsedWidgetUsesAllUsageSignals(t *testing.T) {
	usage := []models.WidgetUsage{
		{WidgetID: "widget-1", WidgetName: "Simulation Light", AssignedCount: 1, PublishedCount: 0, SimulationCount: 0},
		{WidgetID: "widget-2", WidgetName: "Published Heavy", AssignedCount: 4, PublishedCount: 3, SimulationCount: 0},
	}

	widgetName := mostUsedWidget(usage)
	if widgetName != "Published Heavy" {
		t.Fatalf("expected most used widget to use assigned and published counts, got %q", widgetName)
	}
}

func TestClientEngagementPercentageUsesAssignedClientsOverTotalClients(t *testing.T) {
	engagement := clientEngagementPercentage(2, 5)
	if engagement != 40 {
		t.Fatalf("expected 2 assigned clients over 5 total clients to be 40%%, got %d%%", engagement)
	}
}

func TestClientEngagementPercentageHandlesNoClients(t *testing.T) {
	engagement := clientEngagementPercentage(2, 0)
	if engagement != 0 {
		t.Fatalf("expected no total clients to return 0%% engagement, got %d%%", engagement)
	}
}
