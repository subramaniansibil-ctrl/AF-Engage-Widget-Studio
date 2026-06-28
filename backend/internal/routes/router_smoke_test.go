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
		services.NewClientManagementService(advisorRepository),
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
	router := NewRouter(cfg, services.NewStatusService(repositories.NewStatusRepository(cfg)), services.NewAuthService(authRepository), services.NewAdvisorService(advisorRepository), services.NewWidgetService(widgetRepository), services.NewClientService(advisorRepository, widgetRepository, repositories.NewMockClientRepository()), services.NewSimulationService(), services.NewAnalyticsService(repositories.NewMockAnalyticsRepository()), services.NewClientManagementService(advisorRepository))

	advisorToken := loginToken(t, router, "advisor@afengage.com")
	forbiddenRequest := httptest.NewRequest(http.MethodGet, "/api/v1/admin/clients", nil)
	forbiddenRequest.Header.Set("Authorization", "Bearer "+advisorToken)
	forbiddenRecorder := httptest.NewRecorder()
	router.ServeHTTP(forbiddenRecorder, forbiddenRequest)
	if forbiddenRecorder.Code != http.StatusForbidden {
		t.Fatalf("expected advisor to receive 403, got %d", forbiddenRecorder.Code)
	}

	adminToken := loginToken(t, router, "admin@afengage.com")
	clientBody, _ := json.Marshal(models.ClientUpsertRequest{ID: "client-admin-001", Name: "Admin Created", Email: "created@example.com", MobileNumber: "+27 82 555 0199", AssignedAdvisor: "Advisor User", Status: models.ClientStatusActive})
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
