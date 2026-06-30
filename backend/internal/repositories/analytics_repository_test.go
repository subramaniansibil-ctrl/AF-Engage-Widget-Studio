package repositories

import "testing"

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
