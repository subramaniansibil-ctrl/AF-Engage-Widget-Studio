package services

import (
	"context"
	"testing"

	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
)

func TestClientManagementCreateRejectsDuplicates(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	request := validClientRequest("client-001", "new@example.com")
	if _, err := service.CreateClient(context.Background(), request); err != repositories.ErrDuplicateClientID {
		t.Fatalf("expected duplicate client ID, got %v", err)
	}
	request = validClientRequest("new-client", "client@afengage.com")
	if _, err := service.CreateClient(context.Background(), request); err != repositories.ErrDuplicateClientEmail {
		t.Fatalf("expected duplicate email, got %v", err)
	}
}

func TestClientManagementListUsesSharedSorting(t *testing.T) {
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), repositories.NewMockAuthRepository())
	clients, _, err := service.ListClients(context.Background(), models.ClientManagementFilters{SortBy: "name", SortOrder: "asc", Page: 1, PageSize: 100})
	if err != nil {
		t.Fatalf("list clients: %v", err)
	}
	for index := 1; index < len(clients); index++ {
		if clients[index-1].Name > clients[index].Name {
			t.Fatalf("clients are not sorted by name: %q before %q", clients[index-1].Name, clients[index].Name)
		}
	}
}

func TestClientManagementCreateCreatesLoginAccount(t *testing.T) {
	authRepository := repositories.NewMockAuthRepository()
	service := NewClientManagementService(repositories.NewMockAdvisorRepository(), authRepository)
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
	clients, totalItems, err := service.ListClients(context.Background(), models.ClientManagementFilters{Search: "client-101"})
	if err != nil || len(clients) != 1 || totalItems != 1 {
		t.Fatalf("expected valid row to be persisted, clients=%d total=%d err=%v", len(clients), totalItems, err)
	}
}

func TestAdminMustAssignAnActiveAdvisor(t *testing.T) {
	repository := repositories.NewMockAdvisorRepository()
	service := NewClientManagementService(repository, repositories.NewMockAuthRepository(), repository)
	request := validClientRequest("client-admin-invalid", "admin-invalid@example.com")
	request.AssignedAdvisor = "Unknown Advisor"

	_, err := service.CreateClient(context.Background(), request, models.User{Role: models.RoleAdmin, Name: "Admin User"})
	if validationError, ok := err.(*ClientValidationError); !ok || validationError.Field != "assignedAdvisor" {
		t.Fatalf("expected active advisor validation error, got %v", err)
	}
}

func TestAdvisorCreateForcesOwnAssignment(t *testing.T) {
	repository := repositories.NewMockAdvisorRepository()
	service := NewClientManagementService(repository, repositories.NewMockAuthRepository(), repository)
	request := validClientRequest("client-advisor-create", "advisor-create@example.com")
	request.AssignedAdvisor = "Another Advisor"

	created, err := service.CreateClient(context.Background(), request, models.User{Role: models.RoleAdvisor, Name: "Sarah Williams"})
	if err != nil {
		t.Fatalf("expected advisor create to succeed, got %v", err)
	}
	if created.AssignedAdvisor != "Sarah Williams" {
		t.Fatalf("expected logged-in advisor assignment, got %q", created.AssignedAdvisor)
	}
}

func TestAdvisorUpdatePreservesAssignmentAndCannotAccessAnotherAdvisorClient(t *testing.T) {
	repository := repositories.NewMockAdvisorRepository()
	service := NewClientManagementService(repository, repositories.NewMockAuthRepository(), repository)
	actor := models.User{Role: models.RoleAdvisor, Name: "Sarah Williams"}
	existing, err := service.GetClient(context.Background(), "client-001", actor)
	if err != nil {
		t.Fatalf("expected assigned client, got %v", err)
	}
	request := validClientRequest(existing.ID, existing.Email)
	request.Name = "Updated by advisor"
	request.AssignedAdvisor = "Another Advisor"
	request.Password = ""
	request.ConfirmPassword = ""
	updated, err := service.UpdateClient(context.Background(), existing.ID, request, actor)
	if err != nil {
		t.Fatalf("expected assigned client update, got %v", err)
	}
	if updated.AssignedAdvisor != actor.Name {
		t.Fatalf("expected assignment to remain %q, got %q", actor.Name, updated.AssignedAdvisor)
	}

	if _, err := service.GetClient(context.Background(), "client-002", models.User{Role: models.RoleAdvisor, Name: "Someone Else"}); err != repositories.ErrClientNotFound {
		t.Fatalf("expected another advisor client to be hidden, got %v", err)
	}
}

func TestAdvisorBulkImportForcesOwnAssignment(t *testing.T) {
	repository := repositories.NewMockAdvisorRepository()
	service := NewClientManagementService(repository, repositories.NewMockAuthRepository(), repository)
	row := validClientRequest("client-advisor-bulk", "advisor-bulk@example.com")
	row.AssignedAdvisor = "Another Advisor"
	response := service.ImportClients(context.Background(), models.BulkClientImportRequest{Rows: []models.BulkClientRow{{RowNumber: 2, Client: row}}}, models.User{Role: models.RoleAdvisor, Name: "Sarah Williams"})
	if response.Imported != 1 || response.Clients[0].AssignedAdvisor != "Sarah Williams" {
		t.Fatalf("expected advisor bulk assignment, got %+v", response)
	}
}

func validClientRequest(id, email string) models.ClientUpsertRequest {
	return models.ClientUpsertRequest{
		ID: id, Name: "Test Client", Email: email, MobileNumber: "+27 82 555 0101",
		AssignedAdvisor: "Sarah Williams", Status: models.ClientStatusActive, RiskProfile: models.RiskModerate,
		Password: "Password123", ConfirmPassword: "Password123",
	}
}
