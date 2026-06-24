package routes

import (
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
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORS(), middleware.JWTReady())

	statusHandler := handlers.NewStatusHandler(statusService)
	authHandler := handlers.NewAuthHandler(authService)
	advisorHandler := handlers.NewAdvisorHandler(advisorService)
	widgetHandler := handlers.NewWidgetHandler(widgetService)
	clientHandler := handlers.NewClientHandler(clientService)
	simulationHandler := handlers.NewSimulationHandler(simulationService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	router.GET("/health", statusHandler.Health)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/status", statusHandler.Status)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(authService), authHandler.Me)
		}
		widgets := v1.Group("/widgets", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			widgets.GET("", widgetHandler.ListWidgets)
			widgets.GET("/:id", widgetHandler.GetWidget)
		}
		advisor := v1.Group("/advisor", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			advisor.GET("/dashboard", advisorHandler.Dashboard)
			advisor.GET("/clients", advisorHandler.ListClients)
			advisor.GET("/clients/:clientId", advisorHandler.GetClient)
			advisor.POST("/clients/:clientId/widgets/configure", widgetHandler.ConfigureWidget)
			advisor.POST("/clients/:clientId/widgets/assign", widgetHandler.AssignWidget)
			advisor.GET("/clients/:clientId/assigned-widgets", widgetHandler.ListAssignedWidgets)
			advisor.POST("/clients/:clientId/publish-dashboard", widgetHandler.PublishDashboard)
		}
		client := v1.Group("/client", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleClient, models.RoleAdmin))
		{
			client.GET("/dashboard", clientHandler.Dashboard)
			client.GET("/widgets", clientHandler.Widgets)
			client.GET("/recommendations", clientHandler.Recommendations)
			client.POST("/simulations", clientHandler.SaveSimulation)
		}
		simulations := v1.Group("/simulations", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleClient, models.RoleAdmin))
		{
			simulations.POST("/two-pot", simulationHandler.TwoPot)
			simulations.POST("/onefee", simulationHandler.Onefee)
			simulations.POST("/income-sustainability", simulationHandler.IncomeSustainability)
		}
		analytics := v1.Group("/analytics", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			analytics.GET("/advisor", analyticsHandler.AdvisorAnalytics)
			analytics.GET("/widgets", analyticsHandler.WidgetUsage)
		}
		notifications := v1.Group("/notifications", middleware.AuthMiddleware(authService))
		{
			notifications.GET("", analyticsHandler.Notifications)
			notifications.PATCH("/:id/read", analyticsHandler.MarkNotificationRead)
		}
		v1.GET("/audit-logs", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdmin), analyticsHandler.AuditLogs)
	}

	return router
}
