package services

import (
	"context"
	"testing"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
)

func TestClientManagementCreateRejectsDuplicates(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	request := validClientRequest("client-001", "new@example.com")
	if _, err := service.CreateClient(context.Background(), request); err != repositories.ErrDuplicateClientID {
		t.Fatalf("expected duplicate client ID, got %v", err)
	}
	request = validClientRequest("new-client", "avery.chen@example.com")
	if _, err := service.CreateClient(context.Background(), request); err != repositories.ErrDuplicateClientEmail {
		t.Fatalf("expected duplicate email, got %v", err)
	}
}

func TestClientManagementCreateCreatesLoginAccount(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	request := validClientRequest("client-201", "login@example.com")
	request.Password = "Password123"
	request.ConfirmPassword = "Password123"

	created, err := service.CreateClient(context.Background(), request)
	if err != nil {
		t.Fatalf("expected client create to succeed, got %v", err)
	}
	if created.ID != "client-201" {
		t.Fatalf("expected created client id client-201, got %s", created.ID)
	}

	authRepository := repositories.NewMockAuthRepository()
	user, token, err := authRepository.Authenticate(context.Background(), "login@example.com", "Password123")
	if err != nil {
		t.Fatalf("expected auth login to succeed after client creation, got %v", err)
	}
	if token == "" || user.Email != "login@example.com" || user.ClientID != created.ID {
		t.Fatalf("expected client auth user to be created, got %+v", user)
	}
}

func TestClientManagementCreateAllowsMissingConfirmPassword(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	request := validClientRequest("client-202", "missing-confirm@example.com")
	request.ConfirmPassword = ""

	created, err := service.CreateClient(context.Background(), request)
	if err != nil {
		t.Fatalf("expected client create to succeed without confirm password, got %v", err)
	}
	if created.ID != "client-202" {
		t.Fatalf("expected created client id client-202, got %s", created.ID)
	}
}

func TestClientManagementBulkImportKeepsValidRows(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	response := service.ImportClients(context.Background(), models.BulkClientImportRequest{Rows: []models.BulkClientRow{
		{RowNumber: 2, Client: validClientRequest("client-101", "valid@example.com")},
		{RowNumber: 3, Client: validClientRequest("client-102", "invalid-email")},
		{RowNumber: 4, Client: validClientRequest("client-103", "valid@example.com")},
	}})
	if response.Imported != 1 || response.Failed != 2 {
		t.Fatalf("expected 1 imported and 2 failed, got %d and %d", response.Imported, response.Failed)
	}
	clients, err := service.ListClients(context.Background(), models.ClientManagementFilters{Search: "client-101"})
	if err != nil || len(clients) != 1 {
		t.Fatalf("expected valid row to be persisted, clients=%d err=%v", len(clients), err)
	}
}

func validClientRequest(id, email string) models.ClientUpsertRequest {
	return models.ClientUpsertRequest{
		ID: id, Name: "Test Client", Email: email, MobileNumber: "+27 82 555 0101",
		AssignedAdvisor: "Advisor User", Status: models.ClientStatusActive, RiskProfile: models.RiskModerate,
		Password: "Password123", ConfirmPassword: "Password123",
	}
}
