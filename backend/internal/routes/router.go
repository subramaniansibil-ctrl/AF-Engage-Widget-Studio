package routes

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/handlers"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/middleware"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func NewRouter(cfg config.Config, statusService services.StatusService, authService services.AuthService, advisorService services.AdvisorService, widgetService services.WidgetService, clientService services.ClientService, simulationService services.SimulationService, analyticsService services.AnalyticsService) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(middleware.StructuredLogger(slog.Default()), gin.Recovery(), middleware.CORS(cfg), middleware.RateLimit(cfg), middleware.JWTReady())

	statusHandler := handlers.NewStatusHandler(statusService)
	authHandler := handlers.NewAuthHandler(authService)
	advisorHandler := handlers.NewAdvisorHandler(advisorService)
	widgetHandler := handlers.NewWidgetHandler(widgetService)
	clientHandler := handlers.NewClientHandler(clientService)
	simulationHandler := handlers.NewSimulationHandler(simulationService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	router.GET("/health", statusHandler.Health) // GET /health returns service liveness and version metadata.

	v1 := router.Group("/api/v1")
	{
		v1.GET("/status", statusHandler.Status) // GET /api/v1/status returns demo API readiness details.
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)                                  // POST /api/v1/auth/login authenticates mock demo users.
			auth.POST("/logout", authHandler.Logout)                                // POST /api/v1/auth/logout invalidates the current mock token.
			auth.GET("/me", middleware.AuthMiddleware(authService), authHandler.Me) // GET /api/v1/auth/me returns the authenticated user.
		}
		widgets := v1.Group("/widgets", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			widgets.GET("", widgetHandler.ListWidgets)   // GET /api/v1/widgets lists reusable widgets available to advisors.
			widgets.GET("/:id", widgetHandler.GetWidget) // GET /api/v1/widgets/:id returns a single widget definition.
		}
		advisor := v1.Group("/advisor", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			advisor.GET("/dashboard", advisorHandler.Dashboard)                                   // GET /api/v1/advisor/dashboard returns advisor KPI cards and widget usage.
			advisor.GET("/clients", advisorHandler.ListClients)                                   // GET /api/v1/advisor/clients lists clients with search/filter support.
			advisor.GET("/clients/:clientId", advisorHandler.GetClient)                           // GET /api/v1/advisor/clients/:clientId returns a complete client profile.
			advisor.POST("/clients/:clientId/widgets/configure", widgetHandler.ConfigureWidget)   // POST /api/v1/advisor/clients/:clientId/widgets/configure saves widget options.
			advisor.POST("/clients/:clientId/widgets/assign", widgetHandler.AssignWidget)         // POST /api/v1/advisor/clients/:clientId/widgets/assign assigns a widget to a client.
			advisor.GET("/clients/:clientId/assigned-widgets", widgetHandler.ListAssignedWidgets) // GET /api/v1/advisor/clients/:clientId/assigned-widgets lists assigned widgets.
			advisor.POST("/clients/:clientId/publish-dashboard", widgetHandler.PublishDashboard)  // POST /api/v1/advisor/clients/:clientId/publish-dashboard publishes assignments.
		}
		client := v1.Group("/client", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleClient, models.RoleAdmin))
		{
			client.GET("/dashboard", clientHandler.Dashboard)             // GET /api/v1/client/dashboard returns the personalized client portal payload.
			client.GET("/widgets", clientHandler.Widgets)                 // GET /api/v1/client/widgets returns only assigned client widgets.
			client.GET("/recommendations", clientHandler.Recommendations) // GET /api/v1/client/recommendations returns client-ready guidance prompts.
			client.POST("/simulations", clientHandler.SaveSimulation)     // POST /api/v1/client/simulations saves widget simulation history.
		}
		simulations := v1.Group("/simulations", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleClient, models.RoleAdmin))
		{
			simulations.POST("/two-pot", simulationHandler.TwoPot)                             // POST /api/v1/simulations/two-pot calculates two-pot illustration outputs.
			simulations.POST("/onefee", simulationHandler.Onefee)                              // POST /api/v1/simulations/onefee calculates fee comparison illustration outputs.
			simulations.POST("/income-sustainability", simulationHandler.IncomeSustainability) // POST /api/v1/simulations/income-sustainability calculates income longevity outputs.
		}
		analytics := v1.Group("/analytics", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			analytics.GET("/advisor", analyticsHandler.AdvisorAnalytics) // GET /api/v1/analytics/advisor returns advisor engagement analytics.
			analytics.GET("/widgets", analyticsHandler.WidgetUsage)      // GET /api/v1/analytics/widgets returns widget usage analytics.
		}
		notifications := v1.Group("/notifications", middleware.AuthMiddleware(authService))
		{
			notifications.GET("", analyticsHandler.Notifications)                   // GET /api/v1/notifications lists user notifications.
			notifications.PATCH("/:id/read", analyticsHandler.MarkNotificationRead) // PATCH /api/v1/notifications/:id/read marks one notification read.
		}
		v1.GET("/audit-logs", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdmin), analyticsHandler.AuditLogs) // GET /api/v1/audit-logs lists admin audit events.
	}

	return router
}
