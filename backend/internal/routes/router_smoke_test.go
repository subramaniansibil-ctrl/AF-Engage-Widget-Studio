package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func TestAPISmokeHealthLoginAndAdvisorDashboard(t *testing.T) {
	cfg := config.Config{
		HTTPAddress:  ":8080",
		Environment:  "test",
		ServiceName:  "af-engage-api-test",
		CORSOrigins:  "http://localhost:5173",
		RateLimitRPM: "1000",
	}

	authRepository := repositories.NewMockAuthRepository()
	advisorRepository := repositories.NewMockAdvisorRepository()
	widgetRepository := repositories.NewMockWidgetRepository()
	clientRepository := repositories.NewMockClientRepository()
	router := NewRouter(
		cfg,
		services.NewStatusService(repositories.NewStatusRepository(cfg)),
		services.NewAuthService(authRepository),
		services.NewAdvisorService(advisorRepository),
		services.NewWidgetService(widgetRepository),
		services.NewClientService(advisorRepository, widgetRepository, clientRepository),
		services.NewSimulationService(),
		services.NewAnalyticsService(repositories.NewMockAnalyticsRepository()),
		services.NewClientManagementService(advisorRepository, authRepository),
		services.NewAdvisorManagementService(advisorRepository),
	)

	healthRecorder := httptest.NewRecorder()
	router.ServeHTTP(healthRecorder, httptest.NewRequest(http.MethodGet, "/health", nil))
	if healthRecorder.Code != http.StatusOK {
		t.Fatalf("expected /health 200, got %d", healthRecorder.Code)
	}

	loginBody, _ := json.Marshal(models.LoginRequest{Email: "advisor@afengage.com", Password: "password123"})
	loginRecorder := httptest.NewRecorder()
	router.ServeHTTP(loginRecorder, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody)))
	if loginRecorder.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d: %s", loginRecorder.Code, loginRecorder.Body.String())
	}

	var loginResponse models.LoginResponse
	if err := json.Unmarshal(loginRecorder.Body.Bytes(), &loginResponse); err != nil {
		t.Fatalf("decode login response: %v", err)
	}

	dashboardRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/dashboard", nil)
	dashboardRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	dashboardRecorder := httptest.NewRecorder()
	router.ServeHTTP(dashboardRecorder, dashboardRequest)
	if dashboardRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor dashboard 200, got %d: %s", dashboardRecorder.Code, dashboardRecorder.Body.String())
	}

	publishRequest := httptest.NewRequest(http.MethodPost, "/api/v1/advisor/clients/client-001/publish-dashboard", nil)
	publishRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	publishRecorder := httptest.NewRecorder()
	router.ServeHTTP(publishRecorder, publishRequest)
	if publishRecorder.Code != http.StatusOK {
		t.Fatalf("expected publish to succeed when email is disabled, got %d: %s", publishRecorder.Code, publishRecorder.Body.String())
	}
	var publishResponse struct {
		Success           bool                         `json:"success"`
		EmailNotification string                       `json:"emailNotification"`
		AssignedWidgets   []models.DashboardAssignment `json:"assignedWidgets"`
	}
	if err := json.Unmarshal(publishRecorder.Body.Bytes(), &publishResponse); err != nil {
		t.Fatalf("decode publish response: %v", err)
	}
	if !publishResponse.Success || publishResponse.EmailNotification != "skipped" || len(publishResponse.AssignedWidgets) == 0 {
		t.Fatalf("expected successful publish with non-blocking skipped email, got %+v", publishResponse)
	}
	for _, assignment := range publishResponse.AssignedWidgets {
		if !assignment.Published {
			t.Fatalf("expected assignment %s to be published", assignment.ID)
		}
	}

	clientToken := loginToken(t, router, "client@afengage.com")
	clientWidgetRequest := httptest.NewRequest(http.MethodGet, "/api/v1/client/widgets/two-pot-impact", nil)
	clientWidgetRequest.Header.Set("Authorization", "Bearer "+clientToken)
	clientWidgetRecorder := httptest.NewRecorder()
	router.ServeHTTP(clientWidgetRecorder, clientWidgetRequest)
	if clientWidgetRecorder.Code != http.StatusOK {
		t.Fatalf("expected assigned client widget 200, got %d: %s", clientWidgetRecorder.Code, clientWidgetRecorder.Body.String())
	}
	var clientWidget models.DashboardAssignment
	if err := json.Unmarshal(clientWidgetRecorder.Body.Bytes(), &clientWidget); err != nil {
		t.Fatalf("decode client widget: %v", err)
	}
	if clientWidget.WidgetID != "two-pot-impact" || clientWidget.Configuration.Options["projectionYears"] != "20" || clientWidget.WidgetCategory == "" {
		t.Fatalf("expected published advisor configuration and metadata, got %+v", clientWidget)
	}

	missingWidgetRequest := httptest.NewRequest(http.MethodGet, "/api/v1/client/widgets/not-assigned", nil)
	missingWidgetRequest.Header.Set("Authorization", "Bearer "+clientToken)
	missingWidgetRecorder := httptest.NewRecorder()
	router.ServeHTTP(missingWidgetRecorder, missingWidgetRequest)
	if missingWidgetRecorder.Code != http.StatusNotFound {
		t.Fatalf("expected unassigned widget 404, got %d", missingWidgetRecorder.Code)
	}

	simulationBody, _ := json.Marshal(models.SimulationRequest{Name: "Early Retirement", WidgetID: "two-pot-impact", WidgetName: "Two-Pot Impact", Inputs: map[string]string{"retirementAge": "60"}, Results: map[string]string{"projectedRetirementValue": "R 1 200 000"}, Result: "Goal completion 82%."})
	simulationRequest := httptest.NewRequest(http.MethodPost, "/api/v1/client/simulations", bytes.NewReader(simulationBody))
	simulationRequest.Header.Set("Authorization", "Bearer "+clientToken)
	simulationRequest.Header.Set("Content-Type", "application/json")
	simulationRecorder := httptest.NewRecorder()
	router.ServeHTTP(simulationRecorder, simulationRequest)
	if simulationRecorder.Code != http.StatusOK {
		t.Fatalf("expected simulation save 200, got %d: %s", simulationRecorder.Code, simulationRecorder.Body.String())
	}
	var savedSimulation models.Simulation
	if err := json.Unmarshal(simulationRecorder.Body.Bytes(), &savedSimulation); err != nil {
		t.Fatalf("decode saved simulation: %v", err)
	}

	updateSimulationBody, _ := json.Marshal(models.SimulationUpdateRequest{Name: "Early Retirement 2035", Inputs: savedSimulation.Inputs, Results: savedSimulation.Results, Result: savedSimulation.Result})
	updateSimulationRequest := httptest.NewRequest(http.MethodPut, "/api/v1/client/simulations/"+savedSimulation.ID, bytes.NewReader(updateSimulationBody))
	updateSimulationRequest.Header.Set("Authorization", "Bearer "+clientToken)
	updateSimulationRequest.Header.Set("Content-Type", "application/json")
	updateSimulationRecorder := httptest.NewRecorder()
	router.ServeHTTP(updateSimulationRecorder, updateSimulationRequest)
	if updateSimulationRecorder.Code != http.StatusOK {
		t.Fatalf("expected simulation update 200, got %d", updateSimulationRecorder.Code)
	}

	duplicateBody, _ := json.Marshal(models.DuplicateSimulationRequest{Name: "Early Retirement Copy"})
	duplicateRequestSimulation := httptest.NewRequest(http.MethodPost, "/api/v1/client/simulations/"+savedSimulation.ID+"/duplicate", bytes.NewReader(duplicateBody))
	duplicateRequestSimulation.Header.Set("Authorization", "Bearer "+clientToken)
	duplicateRequestSimulation.Header.Set("Content-Type", "application/json")
	duplicateRecorderSimulation := httptest.NewRecorder()
	router.ServeHTTP(duplicateRecorderSimulation, duplicateRequestSimulation)
	if duplicateRecorderSimulation.Code != http.StatusCreated {
		t.Fatalf("expected simulation duplicate 201, got %d", duplicateRecorderSimulation.Code)
	}

	listSimulationRequest := httptest.NewRequest(http.MethodGet, "/api/v1/client/simulations?widgetId=two-pot-impact", nil)
	listSimulationRequest.Header.Set("Authorization", "Bearer "+clientToken)
	listSimulationRecorder := httptest.NewRecorder()
	router.ServeHTTP(listSimulationRecorder, listSimulationRequest)
	if listSimulationRecorder.Code != http.StatusOK {
		t.Fatalf("expected simulation list 200, got %d", listSimulationRecorder.Code)
	}

	deleteSimulationRequest := httptest.NewRequest(http.MethodDelete, "/api/v1/client/simulations/"+savedSimulation.ID, nil)
	deleteSimulationRequest.Header.Set("Authorization", "Bearer "+clientToken)
	deleteSimulationRecorder := httptest.NewRecorder()
	router.ServeHTTP(deleteSimulationRecorder, deleteSimulationRequest)
	if deleteSimulationRecorder.Code != http.StatusOK {
		t.Fatalf("expected simulation delete 200, got %d", deleteSimulationRecorder.Code)
	}

	assignmentBody, _ := json.Marshal(models.AssignWidgetRequest{WidgetID: "two-pot-impact"})
	assignRequest := httptest.NewRequest(http.MethodPost, "/api/v1/advisor/clients/client-003/widgets/assign", bytes.NewReader(assignmentBody))
	assignRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	assignRequest.Header.Set("Content-Type", "application/json")
	assignRecorder := httptest.NewRecorder()
	router.ServeHTTP(assignRecorder, assignRequest)
	if assignRecorder.Code != http.StatusOK {
		t.Fatalf("expected assignment 200, got %d: %s", assignRecorder.Code, assignRecorder.Body.String())
	}
	var assignment models.DashboardAssignment
	if err := json.Unmarshal(assignRecorder.Body.Bytes(), &assignment); err != nil {
		t.Fatalf("decode assignment response: %v", err)
	}

	updateBody, _ := json.Marshal(models.UpdateAssignedWidgetRequest{Options: map[string]string{"projectionYears": "27"}})
	updateRequest := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/advisor/clients/client-003/assigned-widgets/%s", assignment.ID), bytes.NewReader(updateBody))
	updateRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	updateRequest.Header.Set("Content-Type", "application/json")
	updateRecorder := httptest.NewRecorder()
	router.ServeHTTP(updateRecorder, updateRequest)
	if updateRecorder.Code != http.StatusOK {
		t.Fatalf("expected assignment update 200, got %d: %s", updateRecorder.Code, updateRecorder.Body.String())
	}
	var updatedAssignment models.DashboardAssignment
	if err := json.Unmarshal(updateRecorder.Body.Bytes(), &updatedAssignment); err != nil {
		t.Fatalf("decode updated assignment: %v", err)
	}
	if updatedAssignment.Configuration.Options["projectionYears"] != "27" || updatedAssignment.UpdatedAt.IsZero() {
		t.Fatalf("expected updated options and timestamp, got %+v", updatedAssignment)
	}

	duplicateRequest := httptest.NewRequest(http.MethodPost, "/api/v1/advisor/clients/client-003/widgets/assign", bytes.NewReader(assignmentBody))
	duplicateRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	duplicateRequest.Header.Set("Content-Type", "application/json")
	duplicateRecorder := httptest.NewRecorder()
	router.ServeHTTP(duplicateRecorder, duplicateRequest)
	if duplicateRecorder.Code != http.StatusConflict {
		t.Fatalf("expected duplicate assignment 409, got %d: %s", duplicateRecorder.Code, duplicateRecorder.Body.String())
	}

	deleteRequest := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/advisor/clients/client-003/assigned-widgets/%s", assignment.ID), nil)
	deleteRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	deleteRecorder := httptest.NewRecorder()
	router.ServeHTTP(deleteRecorder, deleteRequest)
	if deleteRecorder.Code != http.StatusOK {
		t.Fatalf("expected delete assignment 200, got %d: %s", deleteRecorder.Code, deleteRecorder.Body.String())
	}

	listRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/clients/client-003/assigned-widgets", nil)
	listRequest.Header.Set("Authorization", "Bearer "+loginResponse.Token)
	listRecorder := httptest.NewRecorder()
	router.ServeHTTP(listRecorder, listRequest)
	if listRecorder.Code != http.StatusOK {
		t.Fatalf("expected assigned widget list 200, got %d: %s", listRecorder.Code, listRecorder.Body.String())
	}
	var assignments []models.DashboardAssignment
	if err := json.Unmarshal(listRecorder.Body.Bytes(), &assignments); err != nil {
		t.Fatalf("decode assigned widget list: %v", err)
	}
	if len(assignments) != 0 {
		t.Fatalf("expected deleted widget to be absent, got %d assignments", len(assignments))
	}
}

func TestAdminClientManagementPermissionsAndDuplicates(t *testing.T) {
	cfg := config.Config{Environment: "test", ServiceName: "af-engage-api-test", CORSOrigins: "http://localhost:5173", RateLimitRPM: "1000"}
	authRepository := repositories.NewMockAuthRepository()
	advisorRepository := repositories.NewMockAdvisorRepository()
	widgetRepository := repositories.NewMockWidgetRepository()
	router := NewRouter(cfg, services.NewStatusService(repositories.NewStatusRepository(cfg)), services.NewAuthService(authRepository), services.NewAdvisorService(advisorRepository), services.NewWidgetService(widgetRepository), services.NewClientService(advisorRepository, widgetRepository, repositories.NewMockClientRepository()), services.NewSimulationService(), services.NewAnalyticsService(repositories.NewMockAnalyticsRepository()), services.NewClientManagementService(advisorRepository, authRepository), services.NewAdvisorManagementService(advisorRepository))

	advisorToken := loginToken(t, router, "advisor@afengage.com")
	forbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/admin/clients", nil)
	forbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	forbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(forbiddenRecorder, forbiddenRequest)
	if forbiddenRecorder.Code != http.StatusForbidden {
		t.Fatalf("expected advisor to receive 403, got %d", forbiddenRecorder.Code)
	}

	adminToken := loginToken(t, router, "admin@afengage.com")
	clientBody, _ := json.Marshal(models.ClientUpsertRequest{ID: "client-admin-001", Name: "Admin Created", Email: "created@example.com", MobileNumber: "+27 82 555 0199", AssignedAdvisor: "Advisor User", Status: models.ClientStatusActive, Password: "Password123", ConfirmPassword: "Password123"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/v1/admin/clients", bytes.NewReader(clientBody))
	createRequest.Header.Set("Authorization", "Bearer "+adminToken)
	createRequest.Header.Set("Content-Type", "application/json")
	createRecorder := httptest.NewRecorder()
	router.ServeHTTP(createRecorder, createRequest)
	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected client create 201, got %d: %s", createRecorder.Code, createRecorder.Body.String())
	}

	duplicateRequest := httptest.NewRequest(http.MethodPost, "/api/v1/admin/clients", bytes.NewReader(clientBody))
	duplicateRequest.Header.Set("Authorization", "Bearer "+adminToken)
	duplicateRequest.Header.Set("Content-Type", "application/json")
	duplicateRecorder := httptest.NewRecorder()
	router.ServeHTTP(duplicateRecorder, duplicateRequest)
	if duplicateRecorder.Code != http.StatusConflict {
		t.Fatalf("expected duplicate client 409, got %d: %s", duplicateRecorder.Code, duplicateRecorder.Body.String())
	}
}

func TestAdvisorClientListAndAuthorization(t *testing.T) {
	cfg := config.Config{Environment: "test", ServiceName: "af-engage-api-test", CORSOrigins: "http://localhost:5173", RateLimitRPM: "1000"}
	authRepository := repositories.NewMockAuthRepository()
	advisorRepository := repositories.NewMockAdvisorRepository()
	widgetRepository := repositories.NewMockWidgetRepository()
	clientRepository := repositories.NewMockClientRepository()
	router := NewRouter(cfg, services.NewStatusService(repositories.NewStatusRepository(cfg)), services.NewAuthService(authRepository), services.NewAdvisorService(advisorRepository), services.NewWidgetService(widgetRepository), services.NewClientService(advisorRepository, widgetRepository, clientRepository), services.NewSimulationService(), services.NewAnalyticsService(repositories.NewMockAnalyticsRepository()), services.NewClientManagementService(advisorRepository, authRepository), services.NewAdvisorManagementService(advisorRepository))

	advisorToken := loginToken(t, router, "advisor@afengage.com")
	adminToken := loginToken(t, router, "admin@afengage.com")

	clientBody, _ := json.Marshal(models.ClientUpsertRequest{ID: "client-other-001", Name: "Other Client", Email: "other.client@example.com", MobileNumber: "+1 555 0110", AssignedAdvisor: "Other Advisor", Status: models.ClientStatusActive, DateOfBirth: "1980-01-01", RiskProfile: models.RiskModerate, InvestmentGoal: "Test", PortfolioID: "portfolio-other-001", Notes: "Unauthorized client test", Password: "Password123", ConfirmPassword: "Password123"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/v1/admin/clients", bytes.NewReader(clientBody))
	createRequest.Header.Set("Authorization", "Bearer "+adminToken)
	createRequest.Header.Set("Content-Type", "application/json")
	createRecorder := httptest.NewRecorder()
	router.ServeHTTP(createRecorder, createRequest)
	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected client create 201, got %d: %s", createRecorder.Code, createRecorder.Body.String())
	}

	managedBody, _ := json.Marshal(models.ClientUpsertRequest{ID: "client-managed-001", Name: "Advisor Managed", Email: "advisor.managed@example.com", MobileNumber: "+27 82 555 0111", AssignedAdvisor: "Other Advisor", Status: models.ClientStatusActive, DateOfBirth: "1985-01-01", RiskProfile: models.RiskModerate, InvestmentGoal: "Advisor workflow", PortfolioID: "portfolio-managed-001", Notes: "Created through advisor management", Password: "Password123", ConfirmPassword: "Password123"})
	managedCreateRequest := httptest.NewRequest(http.MethodPost, "/api/v1/client-management", bytes.NewReader(managedBody))
	managedCreateRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	managedCreateRequest.Header.Set("Content-Type", "application/json")
	managedCreateRecorder := httptest.NewRecorder()
	router.ServeHTTP(managedCreateRecorder, managedCreateRequest)
	if managedCreateRecorder.Code != http.StatusCreated {
		t.Fatalf("expected advisor client-management create 201, got %d: %s", managedCreateRecorder.Code, managedCreateRecorder.Body.String())
	}
	var managedClient models.Client
	if err := json.Unmarshal(managedCreateRecorder.Body.Bytes(), &managedClient); err != nil {
		t.Fatalf("decode advisor managed client: %v", err)
	}
	if managedClient.AssignedAdvisor != "Advisor User" {
		t.Fatalf("expected backend to force logged-in advisor assignment, got %q", managedClient.AssignedAdvisor)
	}

	managedListRequest := httptest.NewRequest(http.MethodGet, "/api/v1/client-management?search=Advisor%20Managed", nil)
	managedListRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	managedListRecorder := httptest.NewRecorder()
	router.ServeHTTP(managedListRecorder, managedListRequest)
	if managedListRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor client-management list 200, got %d: %s", managedListRecorder.Code, managedListRecorder.Body.String())
	}
	var managedPage struct {
		Items []models.Client       `json:"items"`
		Meta  models.PaginationMeta `json:"meta"`
	}
	if err := json.Unmarshal(managedListRecorder.Body.Bytes(), &managedPage); err != nil {
		t.Fatalf("decode advisor client-management list: %v", err)
	}
	if len(managedPage.Items) != 1 || managedPage.Items[0].ID != "client-managed-001" {
		t.Fatalf("expected advisor management list to return created client only, got %+v", managedPage.Items)
	}

	listRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/clients", nil)
	listRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	listRecorder := httptest.NewRecorder()
	router.ServeHTTP(listRecorder, listRequest)
	if listRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor client list 200, got %d: %s", listRecorder.Code, listRecorder.Body.String())
	}

	var clientPage struct {
		Items []models.Client       `json:"items"`
		Meta  models.PaginationMeta `json:"meta"`
	}
	if err := json.Unmarshal(listRecorder.Body.Bytes(), &clientPage); err != nil {
		t.Fatalf("decode advisor client list: %v", err)
	}
	if len(clientPage.Items) == 0 {
		t.Fatalf("expected advisor client list to contain clients")
	}
	for _, client := range clientPage.Items {
		if client.ID == "client-other-001" {
			t.Fatalf("advisor should not see clients assigned to another advisor")
		}
	}

	searchRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/clients?search=Avery", nil)
	searchRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	searchRecorder := httptest.NewRecorder()
	router.ServeHTTP(searchRecorder, searchRequest)
	if searchRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor client search 200, got %d: %s", searchRecorder.Code, searchRecorder.Body.String())
	}
	var searchResults struct {
		Items []models.Client       `json:"items"`
		Meta  models.PaginationMeta `json:"meta"`
	}
	if err := json.Unmarshal(searchRecorder.Body.Bytes(), &searchResults); err != nil {
		t.Fatalf("decode advisor client search: %v", err)
	}
	if len(searchResults.Items) == 0 {
		t.Fatalf("expected advisor search to return at least one result")
	}

	forbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/clients/client-other-001", nil)
	forbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	forbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(forbiddenRecorder, forbiddenRequest)
	if forbiddenRecorder.Code != http.StatusForbidden {
		t.Fatalf("expected advisor to receive 403 for unauthorized client, got %d", forbiddenRecorder.Code)
	}

	managedForbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/client-management/client-other-001", nil)
	managedForbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	managedForbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(managedForbiddenRecorder, managedForbiddenRequest)
	if managedForbiddenRecorder.Code != http.StatusNotFound {
		t.Fatalf("expected advisor client-management unauthorized client to be hidden with 404, got %d", managedForbiddenRecorder.Code)
	}

	widgetsForbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/advisor/clients/client-other-001/assigned-widgets", nil)
	widgetsForbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	widgetsForbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(widgetsForbiddenRecorder, widgetsForbiddenRequest)
	if widgetsForbiddenRecorder.Code != http.StatusNotFound {
		t.Fatalf("expected another advisor's widget assignments to be hidden with 404, got %d", widgetsForbiddenRecorder.Code)
	}
}

func TestAdminAdvisorManagementPermissionsAndCrud(t *testing.T) {
	cfg := config.Config{Environment: "test", ServiceName: "af-engage-api-test", CORSOrigins: "http://localhost:5173", RateLimitRPM: "1000"}
	authRepository := repositories.NewMockAuthRepository()
	advisorRepository := repositories.NewMockAdvisorRepository()
	widgetRepository := repositories.NewMockWidgetRepository()
	router := NewRouter(cfg, services.NewStatusService(repositories.NewStatusRepository(cfg)), services.NewAuthService(authRepository), services.NewAdvisorService(advisorRepository), services.NewWidgetService(widgetRepository), services.NewClientService(advisorRepository, widgetRepository, repositories.NewMockClientRepository()), services.NewSimulationService(), services.NewAnalyticsService(repositories.NewMockAnalyticsRepository()), services.NewClientManagementService(advisorRepository, authRepository), services.NewAdvisorManagementService(advisorRepository))

	advisorToken := loginToken(t, router, "advisor@afengage.com")
	forbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/admin/advisors", nil)
	forbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	forbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(forbiddenRecorder, forbiddenRequest)
	if forbiddenRecorder.Code != http.StatusForbidden {
		t.Fatalf("expected advisor to receive 403, got %d", forbiddenRecorder.Code)
	}

	adminToken := loginToken(t, router, "admin@afengage.com")
	advisorBody, _ := json.Marshal(models.AdvisorUpsertRequest{ID: "advisor-admin-001", Name: "Admin Advisor", Email: "admin.advisor@example.com", Status: models.AdvisorStatusActive, Password: "password123"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/v1/admin/advisors", bytes.NewReader(advisorBody))
	createRequest.Header.Set("Authorization", "Bearer "+adminToken)
	createRequest.Header.Set("Content-Type", "application/json")
	createRecorder := httptest.NewRecorder()
	router.ServeHTTP(createRecorder, createRequest)
	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected advisor create 201, got %d: %s", createRecorder.Code, createRecorder.Body.String())
	}

	updateBody, _ := json.Marshal(models.AdvisorUpsertRequest{ID: "advisor-admin-001", Name: "Admin Advisor Updated", Email: "admin.advisor@example.com", Status: models.AdvisorStatusActive})
	updateRequest := httptest.NewRequest(http.MethodPut, "/api/v1/admin/advisors/advisor-admin-001", bytes.NewReader(updateBody))
	updateRequest.Header.Set("Authorization", "Bearer "+adminToken)
	updateRequest.Header.Set("Content-Type", "application/json")
	updateRecorder := httptest.NewRecorder()
	router.ServeHTTP(updateRecorder, updateRequest)
	if updateRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor update 200, got %d: %s", updateRecorder.Code, updateRecorder.Body.String())
	}

	disableRequest := httptest.NewRequest(http.MethodDelete, "/api/v1/admin/advisors/advisor-admin-001", nil)
	disableRequest.Header.Set("Authorization", "Bearer "+adminToken)
	disableRecorder := httptest.NewRecorder()
	router.ServeHTTP(disableRecorder, disableRequest)
	if disableRecorder.Code != http.StatusOK {
		t.Fatalf("expected advisor disable 200, got %d: %s", disableRecorder.Code, disableRecorder.Body.String())
	}
}

func loginToken(t *testing.T, router http.Handler, email string) string {
	t.Helper()
	body, _ := json.Marshal(models.LoginRequest{Email: email, Password: "password123"})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK {
		t.Fatalf("login failed for %s: %s", email, recorder.Body.String())
	}
	var response models.LoginResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode login response: %v", err)
	}
	return response.Token
}
