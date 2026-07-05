package repositories

import (
	"context"
	"testing"

	"github.com/af-engage-widget-studio/backend/internal/models"
)

func TestMockWidgetRepositoryAssignsMultipleWidgetsToClient(t *testing.T) {
	repository := NewMockWidgetRepository()
	ctx := context.Background()
	clientID := "client-multi-widget-test"
	widgetIDs := []string{"two-pot-impact", "income-sustainability"}

	for _, widgetID := range widgetIDs {
		configuration, err := repository.ConfigureWidget(ctx, clientID, models.ConfigureWidgetRequest{
			WidgetID: widgetID,
			Options:  map[string]string{"projectionYears": "25"},
		})
		if err != nil {
			t.Fatalf("configure %s: %v", widgetID, err)
		}
		if _, err := repository.AssignWidget(ctx, clientID, models.AssignWidgetRequest{
			WidgetID:        widgetID,
			ConfigurationID: configuration.ID,
		}); err != nil {
			t.Fatalf("assign %s: %v", widgetID, err)
		}
	}

	assignments, err := repository.ListAssignedWidgets(ctx, clientID)
	if err != nil {
		t.Fatalf("list assignments: %v", err)
	}
	if len(assignments) != 2 {
		t.Fatalf("expected 2 assignments, got %d", len(assignments))
	}
	if assignments[0].WidgetID == assignments[1].WidgetID {
		t.Fatal("expected distinct widget assignments")
	}
}

func TestMockWidgetRepositoryRejectsDuplicateAndRemovesAssignment(t *testing.T) {
	repository := NewMockWidgetRepository()
	ctx := context.Background()
	clientID := "client-duplicate-test"
	request := models.AssignWidgetRequest{WidgetID: "two-pot-impact"}

	assignment, err := repository.AssignWidget(ctx, clientID, request)
	if err != nil {
		t.Fatalf("initial assignment: %v", err)
	}
	if _, err := repository.AssignWidget(ctx, clientID, request); err != ErrWidgetAlreadyAssigned {
		t.Fatalf("expected duplicate assignment error, got %v", err)
	}
	if err := repository.RemoveAssignedWidget(ctx, clientID, assignment.ID); err != nil {
		t.Fatalf("remove assignment: %v", err)
	}
	assignments, err := repository.ListAssignedWidgets(ctx, clientID)
	if err != nil {
		t.Fatalf("list assignments: %v", err)
	}
	if len(assignments) != 0 {
		t.Fatalf("expected removed widget to disappear, got %d assignments", len(assignments))
	}
	if _, err := repository.AssignWidget(ctx, clientID, request); err != nil {
		t.Fatalf("expected removed widget to be assignable again: %v", err)
	}
}
