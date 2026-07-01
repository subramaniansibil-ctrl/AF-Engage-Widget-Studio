package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/database"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/routes"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)
	statusRepository := repositories.NewStatusRepository(cfg)

	authRepository := repositories.AuthRepository(repositories.NewMockAuthRepository())
	mockAdvisorRepository := repositories.NewMockAdvisorRepository()
	advisorRepository := repositories.AdvisorRepository(mockAdvisorRepository)
	clientManagementRepository := repositories.ClientManagementRepository(mockAdvisorRepository)
	advisorManagementRepository := repositories.AdvisorManagementRepository(mockAdvisorRepository)
	widgetRepository := repositories.WidgetRepository(repositories.NewMockWidgetRepository())
	clientRepository := repositories.ClientRepository(repositories.NewMockClientRepository())
	analyticsRepository := repositories.AnalyticsRepository(repositories.NewMockAnalyticsRepository())

	if strings.EqualFold(cfg.DataMode, "postgres") {
		db, err := database.OpenPostgres(ctx, cfg.DatabaseURL)
		if err != nil {
			logger.Error("connect_postgres_failed", "error", err)
			os.Exit(1)
		}
		defer db.Close()
		if err := database.RunMigrations(ctx, db, cfg.MigrationsPath); err != nil {
			logger.Error("run_migrations_failed", "error", err)
			os.Exit(1)
		}
		authRepository = repositories.NewPostgresAuthRepository(db)
		postgresAdvisorRepository := repositories.NewPostgresAdvisorRepository(db)
		advisorRepository = postgresAdvisorRepository
		clientManagementRepository = postgresAdvisorRepository
		advisorManagementRepository = postgresAdvisorRepository
		widgetRepository = repositories.NewPostgresWidgetRepository(db)
		clientRepository = repositories.NewPostgresClientRepository(db)
		analyticsRepository = repositories.NewPostgresAnalyticsRepository(db)
		logger.Info("data_mode_selected", "mode", "postgres")
	} else {
		logger.Info("data_mode_selected", "mode", "mock")
	}

	statusService := services.NewStatusService(statusRepository)
	authService := services.NewAuthService(authRepository)
	advisorService := services.NewAdvisorService(advisorRepository)
	widgetService := services.NewWidgetService(widgetRepository)
	clientService := services.NewClientService(advisorRepository, widgetRepository, clientRepository)
	simulationService := services.NewSimulationService()
	analyticsService := services.NewAnalyticsService(analyticsRepository)
	clientManagementService := services.NewClientManagementService(clientManagementRepository, authRepository, advisorManagementRepository)
	advisorManagementService := services.NewAdvisorManagementService(advisorManagementRepository)
	router := routes.NewRouter(cfg, statusService, authService, advisorService, widgetService, clientService, simulationService, analyticsService, clientManagementService, advisorManagementService)

	server := &http.Server{
		Addr:              cfg.HTTPAddress,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("server_started", "service", cfg.ServiceName, "address", cfg.HTTPAddress)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	shutdownSignal := make(chan os.Signal, 1)
	signal.Notify(shutdownSignal, syscall.SIGINT, syscall.SIGTERM)
	<-shutdownSignal

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	logger.Info("server_shutdown_started")
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server_shutdown_failed", "error", err)
		os.Exit(1)
	}
	logger.Info("server_shutdown_complete")
}
