package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/config"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/handlers"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/middleware"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/models"
	"github.com/subramaniansibil-ctrl/af-engage-widget-studio/backend/internal/services"
)

func NewRouter(cfg config.Config, statusService services.StatusService, authService services.AuthService, advisorService services.AdvisorService) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORS(), middleware.JWTReady())

	statusHandler := handlers.NewStatusHandler(statusService)
	authHandler := handlers.NewAuthHandler(authService)
	advisorHandler := handlers.NewAdvisorHandler(advisorService)
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
		advisor := v1.Group("/advisor", middleware.AuthMiddleware(authService), middleware.RoleMiddleware(models.RoleAdvisor, models.RoleAdmin))
		{
			advisor.GET("/dashboard", advisorHandler.Dashboard)
			advisor.GET("/clients", advisorHandler.ListClients)
			advisor.GET("/clients/:id", advisorHandler.GetClient)
		}
	}

	return router
}
