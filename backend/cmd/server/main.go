package main

import (
	"context"
	"log"
	"strings"

	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/database"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/repositories"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/routes"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	statusRepository := repositories.NewStatusRepository(cfg)

	authRepository := repositories.AuthRepository(repositories.NewMockAuthRepository())
	advisorRepository := repositories.AdvisorRepository(repositories.NewMockAdvisorRepository())
	widgetRepository := repositories.WidgetRepository(repositories.NewMockWidgetRepository())
	clientRepository := repositories.ClientRepository(repositories.NewMockClientRepository())
	analyticsRepository := repositories.AnalyticsRepository(repositories.NewMockAnalyticsRepository())

	if strings.EqualFold(cfg.DataMode, "postgres") {
		db, err := database.OpenPostgres(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("connect postgres: %v", err)
		}
		defer db.Close()
		if err := database.RunMigrations(ctx, db, cfg.MigrationsPath); err != nil {
			log.Fatalf("run migrations: %v", err)
		}
		authRepository = repositories.NewPostgresAuthRepository(db)
		advisorRepository = repositories.NewPostgresAdvisorRepository(db)
		widgetRepository = repositories.NewPostgresWidgetRepository(db)
		clientRepository = repositories.NewPostgresClientRepository(db)
		analyticsRepository = repositories.NewPostgresAnalyticsRepository(db)
		log.Printf("data mode: postgres")
	} else {
		log.Printf("data mode: mock")
	}

	statusService := services.NewStatusService(statusRepository)
	authService := services.NewAuthService(authRepository)
	advisorService := services.NewAdvisorService(advisorRepository)
	widgetService := services.NewWidgetService(widgetRepository)
	clientService := services.NewClientService(advisorRepository, widgetRepository, clientRepository)
	simulationService := services.NewSimulationService()
	analyticsService := services.NewAnalyticsService(analyticsRepository)
	router := routes.NewRouter(cfg, statusService, authService, advisorService, widgetService, clientService, simulationService, analyticsService)

	log.Printf("%s listening on %s", cfg.ServiceName, cfg.HTTPAddress)
	if err := router.Run(cfg.HTTPAddress); err != nil {
		log.Fatal(err)
	}
}
