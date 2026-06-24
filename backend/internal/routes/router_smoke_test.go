package routes

import (
	"bytes"
	"encoding/json"
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
}
