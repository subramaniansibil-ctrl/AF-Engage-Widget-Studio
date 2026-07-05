package services

import (
	"context"
	"testing"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

func TestAdvisorManagementCreateRejectsDuplicates(t *testing.T) {
	service := NewAdvisorManagementService(repositories.NewMockAdvisorRepository())
	request := validAdvisorRequest("user_advisor_001", "new.advisor@example.com")
	if _, err := service.CreateAdvisor(context.Background(), request); err != repositories.ErrDuplicateAdvisorID {
		t.Fatalf("expected duplicate advisor ID, got %v", err)
	}
	request = validAdvisorRequest("advisor-new", "advisor@afengage.com")
	if _, err := service.CreateAdvisor(context.Background(), request); err != repositories.ErrDuplicateAdvisorEmail {
		t.Fatalf("expected duplicate email, got %v", err)
	}
}

func TestAdvisorManagementUpdateAndDeactivate(t *testing.T) {
	service := NewAdvisorManagementService(repositories.NewMockAdvisorRepository())
	created, err := service.CreateAdvisor(context.Background(), validAdvisorRequest("advisor-101", "advisor101@example.com"))
	if err != nil {
		t.Fatalf("create advisor: %v", err)
	}
	update := validAdvisorRequest(created.ID, "advisor101.updated@example.com")
	update.Name = "Updated Advisor"
	updated, err := service.UpdateAdvisor(context.Background(), created.ID, update)
	if err != nil {
		t.Fatalf("update advisor: %v", err)
	}
	if updated.Name != "Updated Advisor" || updated.Email != "advisor101.updated@example.com" {
		t.Fatalf("expected updated advisor, got %+v", updated)
	}
	if err := service.DeactivateAdvisor(context.Background(), created.ID); err != nil {
		t.Fatalf("deactivate advisor: %v", err)
	}
	disabled, err := service.GetAdvisor(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("get disabled advisor: %v", err)
	}
	if disabled.Status != models.AdvisorStatusInactive {
		t.Fatalf("expected inactive advisor, got %s", disabled.Status)
	}
}

func validAdvisorRequest(id, email string) models.AdvisorUpsertRequest {
	return models.AdvisorUpsertRequest{
		ID: id, Name: "Test Advisor", Email: email, Status: models.AdvisorStatusActive, Password: "password123",
	}
}
