package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/af-engage-widget-studio/backend/internal/models"
	"github.com/af-engage-widget-studio/backend/internal/repositories"
	"github.com/af-engage-widget-studio/backend/internal/services"
	"github.com/af-engage-widget-studio/backend/internal/utils"
)

type AnalyticsHandler struct {
	service services.AnalyticsService
}

func NewAnalyticsHandler(service services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: service}
}

func (h *AnalyticsHandler) AdminAnalytics(c *gin.Context) {
	analytics, err := h.service.GetAdminAnalytics(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load admin analytics")
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *AnalyticsHandler) AdvisorAnalytics(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	if user.Role != models.RoleAdvisor {
		analytics, err := h.service.GetAdminAnalytics(c.Request.Context())
		if err != nil {
			utils.JSONError(c, http.StatusInternalServerError, "failed to load advisor analytics")
			return
		}
		c.JSON(http.StatusOK, analytics)
		return
	}

	analytics, err := h.service.GetAdvisorAnalytics(c.Request.Context(), user.Name)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load advisor analytics")
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *AnalyticsHandler) WidgetUsage(c *gin.Context) {
	user, ok := currentUser(c)
	if !ok {
		utils.JSONError(c, http.StatusUnauthorized, "authentication required")
		return
	}
	if user.Role == models.RoleAdvisor {
		analytics, err := h.service.GetAdvisorAnalytics(c.Request.Context(), user.Name)
		if err != nil {
			utils.JSONError(c, http.StatusInternalServerError, "failed to load widget usage")
			return
		}
		c.JSON(http.StatusOK, analytics.WidgetUsage)
		return
	}

	usage, err := h.service.GetWidgetUsage(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load widget usage")
		return
	}
	c.JSON(http.StatusOK, usage)
}

func (h *AnalyticsHandler) Notifications(c *gin.Context) {
	notifications, err := h.service.ListNotifications(c.Request.Context())
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load notifications")
		return
	}
	c.JSON(http.StatusOK, notifications)
}

func (h *AnalyticsHandler) MarkNotificationRead(c *gin.Context) {
	notification, err := h.service.MarkNotificationRead(c.Request.Context(), c.Param("id"))
	if errors.Is(err, repositories.ErrNotificationNotFound) {
		utils.JSONError(c, http.StatusNotFound, "notification not found")
		return
	}
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to update notification")
		return
	}
	c.JSON(http.StatusOK, notification)
}

func (h *AnalyticsHandler) AuditLogs(c *gin.Context) {
	pagination := utils.ParsePagination(c, utils.DefaultPageSize, utils.MaxPageSize)
	logs, totalItems, err := h.service.ListAuditLogs(c.Request.Context(), pagination.Page, pagination.PageSize)
	if err != nil {
		utils.JSONError(c, http.StatusInternalServerError, "failed to load audit logs")
		return
	}
	c.JSON(http.StatusOK, models.PaginatedResponse[models.AuditLog]{
		Items: logs,
		Meta:  utils.PaginationMeta(pagination.Page, pagination.PageSize, totalItems),
	})
}

func currentUser(c *gin.Context) (models.User, bool) {
	value, exists := c.Get("user")
	if !exists {
		return models.User{}, false
	}
	user, ok := value.(models.User)
	return user, ok
}
